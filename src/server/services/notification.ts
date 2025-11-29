import { AppDataSource } from "@/db";
import { ActivityType, SurveyType, UserNotificationType } from "@/helpers/types";
import { logger } from "@/lib/logger";
import { Notification } from "@/db/entities/Notification";
import { ParentChild } from "@/db/entities/ParentChild";
import { Admin, InsertResult, IsNull, Not } from "typeorm";
import { User } from "@/db/entities/User";
import { webSocketEvents } from "./websocket-events";

type NotificationInitialPayload = 
    {
        type: UserNotificationType.CHILD_CHECKED_IN;
        child: {
            id: string;
            name: string;
        },
        activitySession: {
            id: string;
            type: ActivityType;
            routeName: string;
            stationName: string;
        }
    }
    |
    {
        type: UserNotificationType.CHILD_CHECKED_OUT;
        child: {
            id: string;
            name: string;
        },
        activitySession: {
            id: string;
            type: ActivityType;
            routeName: string;
            stationName: string;
        }
    }
    |
    {
        type: UserNotificationType.CHILD_MEDICAL_REPORT;
        child: {
            id: string;
            name: string;
        },
        medicalReportId: string;
    }
    |
    {
        type: UserNotificationType.INSTRUCTOR_ASSIGNED_TO_ACTIVITY;
        instructor: {
            email: string;
        },
        activitySession: {
            id: string;
            type: ActivityType;
            routeName: string;
            scheduledAt: Date;
        }
    }
    |
    {
        type: UserNotificationType.NEW_ACTIVITY_ISSUE;
        issueId: string;
        activitySession: {
            id: string;
            type: ActivityType;
            routeName: string;
            scheduledAt: Date;
        }
    }
    |
    {
        type: UserNotificationType.SURVEY_REMINDER;
        parentId: string;
        surveyType: SurveyType;
        child: {
            id: string;
            name: string;
        }
    }
    


function buildNotificationContent(payload: NotificationInitialPayload): { title: string; description: string, uri: string } {
    switch (payload.type) {
        case UserNotificationType.CHILD_CHECKED_IN:
            return {
                title: `Criança entrou na atividade`,
                description: `A criança ${payload.child.name} entrou na estação ${payload.activitySession.stationName} na atividade ${payload.activitySession.type}.`,
                uri: `/activity-session/${payload.activitySession.id}`
            };
        case UserNotificationType.CHILD_CHECKED_OUT:
            return {
                title: `Criança saiu da atividade`,
                description: `A criança ${payload.child.name} saiu na estação ${payload.activitySession.stationName}.`,
                uri: `/activity-session/${payload.activitySession.id}`
            };
        case UserNotificationType.CHILD_MEDICAL_REPORT:
            return {
                title: `Relatório médico da criança`,
                description: `A criança ${payload.child.name} possui um novo relatório médico.`,
                uri: `/medical-report/${payload.medicalReportId}`
            };
        case UserNotificationType.INSTRUCTOR_ASSIGNED_TO_ACTIVITY:
            return {
                title: `Atribuição de nova atividade`,
                description: `Foi-lhe atribuído a atividade ${payload.activitySession.type}, ${payload.activitySession.routeName} agendada para ${payload.activitySession.scheduledAt.toLocaleString()}.`,
                uri: `/activity-session/${payload.activitySession.id}`
            };
        case UserNotificationType.NEW_ACTIVITY_ISSUE:
            return {
                title: `Novo problema reportado na atividade`,
                description: `Foi reportado um novo problema na atividade ${payload.activitySession.type}, ${payload.activitySession.routeName} agendada para ${payload.activitySession.scheduledAt.toLocaleString()}.`,
                uri: `/issue/${payload.issueId}`
            };
        case UserNotificationType.SURVEY_REMINDER:
            return {
                title: `Lembrete de questionário`,
                description: payload.surveyType === SurveyType.PARENT
                    ? `Lembrete para o pai/mãe preencher o questionário para a criança ${payload.child.name}.`
                    : `Lembrete para a criança ${payload.child.name} preencher o questionário.`,
                uri: `/survey?childId=${payload.child.id}?type=${payload.surveyType}`
            };
        default:
            throw new Error('Unknown notification type');
    }
}


async function usersToNotifyForNotificationType(payload: NotificationInitialPayload): Promise<string[]> {
    let usersToNotify: string[] = [];
    
    switch (payload.type) {
        case UserNotificationType.CHILD_CHECKED_IN:
        case UserNotificationType.CHILD_CHECKED_OUT:
        case UserNotificationType.CHILD_MEDICAL_REPORT:
            const parents = await AppDataSource.getRepository(User).find({
            where: {
                parent: {
                    parentChildren: {
                        childId: payload.child.id
                    }
                }
            },
            relations: {
                parent: {
                    parentChildren: true
                }
            }
            });
            usersToNotify = parents.map(user => user.id);
            break;
        
        case UserNotificationType.INSTRUCTOR_ASSIGNED_TO_ACTIVITY:
            usersToNotify = [payload.instructor.email];
            break;

        case UserNotificationType.SURVEY_REMINDER:
            usersToNotify = [payload.parentId];
            break;

        case UserNotificationType.NEW_ACTIVITY_ISSUE:
            const users = await AppDataSource.getRepository(User).find({
                where: {
                    admin: Not(IsNull())
                },
                relations: {
                    admin: true
                }
            });
            usersToNotify = users.map(user => user.id);
            break;

        default:
            throw new Error('Unknown notification type');
    }

    return usersToNotify;
}


function sendWebsocketNotificationToUsers(usersToNotify: string[], insertResult: InsertResult, notificationContent: { title: string; description: string; uri: string }, notificationType: UserNotificationType) {
    insertResult.identifiers.forEach((identifier, index) => {
        const userId = usersToNotify[index];
        const notificationId = identifier.id;

        if (!userId) {
            logger.error(`No userId found for notification id ${notificationId}`);
            return;
        }

        webSocketEvents.sendUserNotification(userId, {
            notificationId: notificationId,
            type: notificationType,
            title: notificationContent.title,
            description: notificationContent.description,
            uri: notificationContent.uri
        });
    });
}


export async function createNotificationForUser(payload: NotificationInitialPayload) {
    try {
        const { title, description, uri } = buildNotificationContent(payload);
        const usersToNotify = await usersToNotifyForNotificationType(payload);
        const payloadBulkData = usersToNotify.map(userId => {
            return {
                userId: userId,
                type: payload.type,
                title: title,
                description: description,
                uri: uri
            }
        })
        const result = await AppDataSource.getRepository(Notification).insert(payloadBulkData);
        sendWebsocketNotificationToUsers(usersToNotify, result, { title, description, uri }, payload.type);

    }
    catch(error){
        logger.error(error instanceof Error ? error.message : String(error))
    }
}