import { AppDataSource } from "@/db";
import { ActivityType, UserNotificationType } from "@/helpers/types";
import { logger } from "@/lib/logger";
import { Notification } from "@/db/entities/Notification";
import { ParentChild } from "@/db/entities/ParentChild";
import { Admin, IsNull, Not } from "typeorm";
import { User } from "@/db/entities/User";

type NotificationInitialPayload = {
    metadata: {
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
}


function buildNotificationContent(payload: NotificationInitialPayload): { title: string; description: string, uri?: string } {
    switch (payload.metadata.type) {
        case UserNotificationType.CHILD_CHECKED_IN:
            return {
                title: `Criança entrou na atividade`,
                description: `A criança ${payload.metadata.child.name} entrou na estação ${payload.metadata.activitySession.stationName} na atividade ${payload.metadata.activitySession.type}.`,
                uri: `/activity-session/${payload.metadata.activitySession.id}`
            };
        case UserNotificationType.CHILD_CHECKED_OUT:
            return {
                title: `Criança saiu da atividade`,
                description: `A criança ${payload.metadata.child.name} saiu na estação ${payload.metadata.activitySession.stationName}.`,
                uri: `/activity-session/${payload.metadata.activitySession.id}`
            };
        case UserNotificationType.CHILD_MEDICAL_REPORT:
            return {
                title: `Relatório médico da criança`,
                description: `A criança ${payload.metadata.child.name} possui um novo relatório médico.`,
                uri: `/medical-report/${payload.metadata.medicalReportId}`
            };
        case UserNotificationType.INSTRUCTOR_ASSIGNED_TO_ACTIVITY:
            return {
                title: `Atribuição de nova atividade`,
                description: `Foi-lhe atribuído a atividade ${payload.metadata.activitySession.type}, ${payload.metadata.activitySession.routeName} agendada para ${payload.metadata.activitySession.scheduledAt.toLocaleString()}.`,
                uri: `/activity-session/${payload.metadata.activitySession.id}`
            };
        case UserNotificationType.NEW_ACTIVITY_ISSUE:
            return {
                title: `Novo problema reportado na atividade`,
                description: `Foi reportado um novo problema na atividade ${payload.metadata.activitySession.type}, ${payload.metadata.activitySession.routeName} agendada para ${payload.metadata.activitySession.scheduledAt.toLocaleString()}.`,
                uri: `/issue/${payload.metadata.issueId}`
            };
        default:
            throw new Error('Unknown notification type');
    }
}


async function usersToNotifyForNotificationType(payload: NotificationInitialPayload): Promise<string[]> {
    let usersToNotify: string[] = [];
    
    switch (payload.metadata.type) {
        case UserNotificationType.CHILD_CHECKED_IN || UserNotificationType.CHILD_CHECKED_OUT || UserNotificationType.CHILD_MEDICAL_REPORT:
            const parents = await AppDataSource.getRepository(ParentChild).find({
                where: {
                    childId: payload.metadata.child.id
                },
                relations: {
                    parent: {
                        user: true
                    }
                }
            });
            usersToNotify = parents.map(parentChild => parentChild.parent.user.id);
            break;
        
        case UserNotificationType.INSTRUCTOR_ASSIGNED_TO_ACTIVITY:
            usersToNotify = [payload.metadata.instructor.email];
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


export async function createNotificationForUser(payload: NotificationInitialPayload) {
    try {
        const { title, description, uri } = buildNotificationContent(payload);
        const usersToNotify = await usersToNotifyForNotificationType(payload);
        
        const payloadBulkData = usersToNotify.map(userId => {
            return {
                userId: userId,
                type: payload.metadata.type,
                title: title,
                description: description,
                uri: uri
            }
        })
        await AppDataSource.getRepository(Notification).insert(payloadBulkData);
    }
    catch(error){
        logger.error(error instanceof Error ? error.message : String(error))
    }
}