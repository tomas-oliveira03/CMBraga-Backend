import { AppDataSource } from "@/db";
import { Child } from "@/db/entities/Child";
import express, { Request, Response } from "express";
import { UpdateChildSchema } from "../schemas/child";
import { map, z } from "zod";
import { Station } from "@/db/entities/Station";
import { ActivityLinkType, ChildStationType, StationType, UserRole } from "@/helpers/types";
import multer from "multer";
import { isValidImageFile } from "@/helpers/storage";
import { updateProfilePicture } from "../services/user";
import { ChildHistory } from "@/db/entities/ChildHistory";
import { differenceInYears } from "date-fns";
import { ParentChild } from "@/db/entities/ParentChild";
import { Parent } from "@/db/entities/Parent";
import { In, IsNull, Not } from "typeorm";
import { ChildActivitySession } from "@/db/entities/ChildActivitySession";
import { Feedback } from "@/db/entities/Feedback";
import { OngoingActivityPayload, OngoingActivitySessionInfo, PreviousActivityPayload, PreviousActivitySessionInfo, UpcomingActivityPayload, UpcomingActivitySessionInfo } from "@/helpers/service-types";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { RouteConnection } from "@/db/entities/RouteConnection";
import { authenticate, authorize } from "../middleware/auth";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', authenticate, authorize(UserRole.ADMIN), async (req: Request, res: Response) => {
    try {
        const allChildren = await AppDataSource.getRepository(Child).find({
            relations: {
                dropOffStation: true
            }
        });

        const childrenPayload = allChildren.map(child => ({
            id: child.id,
            name: child.name,
            profilePictureURL: child.profilePictureURL,
            gender: child.gender,
            heightCentimeters: child.heightCentimeters,
            weightKilograms: child.weightKilograms,
            school: child.school,
            schoolGrade: child.schoolGrade,
            dropOffStation: {
                id: child.dropOffStationId,
                name: child.dropOffStation.name
            },
            dateOfBirth: child.dateOfBirth,
            healthProblems: child.healthProblems,
            createdAt: child.createdAt,
            updatedAt: child.updatedAt
        }));


        return res.status(200).json(childrenPayload);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/:id', authenticate, authorize(UserRole.ADMIN, UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const childId = req.params.id;

        const child = await AppDataSource.getRepository(Child).findOne({
            where: {
                id: childId
            },
            relations: {
                dropOffStation: true,
                parentChildren: true
            }
        });

        if (!child) {
            return res.status(404).json({ message: "Child not found" })
        }
        if (req.user!.role === UserRole.PARENT && !child.parentChildren.some(pc => pc.parentId === req.user!.userId)) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this child's information." });
        }

        return res.status(200).json({
            id: child.id,
            name: child.name,
            profilePictureURL: child.profilePictureURL,
            gender: child.gender,
            heightCentimeters: child.heightCentimeters,
            weightKilograms: child.weightKilograms,
            school: child.school,
            schoolGrade: child.schoolGrade,
            dropOffStation: {
                id: child.dropOffStationId,
                name: child.dropOffStation.name
            },
            dateOfBirth: child.dateOfBirth,
            healthProblems: child.healthProblems,
            createdAt: child.createdAt,
            updatedAt: child.updatedAt
        });
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.put('/:id', authenticate, authorize(UserRole.PARENT), upload.single('file'), async (req: Request, res: Response) => {
    try {
        const childId = req.params.id;
        const validatedData = UpdateChildSchema.parse(req.body);

        const child = await AppDataSource.getRepository(Child).findOne({
            where: { id: childId },
            relations: {
                parentChildren: true
            }
        })
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }
        if (!child.parentChildren.some(pc => pc.parentId === req.user!.userId)) {
            return res.status(403).json({ message: "Forbidden: You do not have permission to update this child's information." });
        }

        if (validatedData.dropOffStationId) {
            const station = await AppDataSource.getRepository(Station).findOne({
                where: {
                    id: validatedData.dropOffStationId,
                    type: StationType.SCHOOL
                }
            })
            if (!station) {
                return res.status(404).json({ message: "Station does not exist or it isn't labeled as school" });
            }


        }

        const { parentId, removeParentId, ...childDataFields } = validatedData;
        const childData = {
            ...childDataFields,
            profilePictureURL: child.profilePictureURL
        }

        if (req.file) {
            if (!isValidImageFile(req.file)) {
                return res.status(400).json({ message: "File must be a valid image type (JPEG, JPG, PNG, WEBP)" });
            }
            childData.profilePictureURL = await updateProfilePicture(child.profilePictureURL, req.file.buffer);
        }

        if (parentId) {
            const parent = await AppDataSource.getRepository(Parent).findOne({
                where: { id: parentId }
            })

            if (!parent) {
                return res.status(404).json({ message: "Parent doesn't exist" });
            }

            const currentParentsCount = await AppDataSource.getRepository(ParentChild).count({
                where: { childId: childId }
            });

            if (currentParentsCount >= 2) {
                return res.status(400).json({ message: "Child already has 2 parents associated" });
            }

            const existingAssociation = await AppDataSource.getRepository(ParentChild).findOne({
                where: {
                    childId: childId,
                    parentId: parentId
                }
            });

            if (existingAssociation) {
                return res.status(400).json({ message: "Parent is already associated with this child" });
            }
        }

        if (removeParentId) {
            const parentAssociation = await AppDataSource.getRepository(ParentChild).findOne({
                where: {
                    childId: childId,
                    parentId: removeParentId
                }
            });

            if (!parentAssociation) {
                return res.status(404).json({ message: "Parent is not associated with this child" });
            }

            const parentsNumber = await AppDataSource.getRepository(ParentChild).count({
                where: { childId: childId }
            });

            if (parentsNumber === 1) {
                return res.status(400).json({ message: "Cannot remove parent: child must have at least one parent" });
            }

            const activitiesNumber = await AppDataSource.getRepository(ChildActivitySession).count({
                where: {
                    childId: childId,
                    parentId: removeParentId
                }
            });

            if (activitiesNumber > 0) {
                return res.status(400).json({ message: "Cannot remove parent: child has activities registered by this parent" });
            }

            const feedbackNumber = await AppDataSource.getRepository(Feedback).count({
                where: {
                    childId: childId,
                    parentId: removeParentId
                }
            });

            if (feedbackNumber > 0) {
                return res.status(400).json({ message: "Cannot remove parent: parent has submitted feedback for this child" });
            }
        }

        const updatedAt = new Date()
        await AppDataSource.transaction(async tx => {
            await tx.getRepository(Child).update(child.id, {
                ...childData,
                updatedAt: updatedAt
            })

            const age = differenceInYears(updatedAt, child.dateOfBirth);

            if (childData.heightCentimeters || childData.weightKilograms) {
                await tx.getRepository(ChildHistory).insert({
                    childId: childId,
                    heightCentimeters: childData.heightCentimeters || child.heightCentimeters,
                    weightKilograms: childData.weightKilograms || child.weightKilograms,
                    age: age
                })
            }

            if (parentId) {
                await tx.getRepository(ParentChild).insert({
                    parentId: parentId,
                    childId: childId
                })
            }

            if (removeParentId) {
                await tx.getRepository(ParentChild).delete({
                    parentId: removeParentId,
                    childId: childId
                })
            }
        })

        return res.status(200).json({
            id: childId,
            name: childData.name,
            profilePictureURL: req.file ? childData.profilePictureURL : undefined,
            updatedAt: updatedAt
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.issues
            });
        }

        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
});


router.get('/available-activities/:id', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const childId = req.params.id!;
        const child = await AppDataSource.getRepository(Child).findOne({ where: { id: childId }, relations: { dropOffStation: true, parentChildren: true } })
        if (!child) {
            return res.status(404).json({ message: "Child not found" });
        }
        if (!child.parentChildren.some(pc => pc.parentId === req.user!.userId)) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this child's information." });
        }

        const allFutureActivitySessions = await AppDataSource.getRepository(ActivitySession).find({
            where: {
                startedAt: IsNull()
            },
            relations: {
                stationActivitySessions: {
                    station: true
                },
                route: true,
                childActivitySessions: true
            }
        })

        const filteredActivitySessionsNotParticipating = allFutureActivitySessions.filter(
            afac => !afac.childActivitySessions.some(cas => cas.childId === childId)
        );

        const allRouteConnectors = await AppDataSource.getRepository(RouteConnection).find({
            relations: {
                toRoute: true
            }
        })

        const futureActivitySessionsSingleRoute = filteredActivitySessionsNotParticipating.filter(activitySession => {
            return activitySession.stationActivitySessions.some(sas => sas.stationId === child.dropOffStationId)
        });

        const futureActivitySessionsConnectorRoute = filteredActivitySessionsNotParticipating.filter(activitySession => {
            const isInSingleRoute = futureActivitySessionsSingleRoute.includes(activitySession);
            if (isInSingleRoute || !activitySession.activityTransferId) return false;

            // Find the transfer target session
            const transferTarget = futureActivitySessionsSingleRoute.find(
                a => a.id === activitySession.activityTransferId
            );
            if (!transferTarget) return false;

            // Find the route connection between the current route and target route
            const connector = allRouteConnectors.find(conn =>
                conn.fromRouteId === activitySession.routeId &&
                conn.toRouteId === transferTarget.routeId
            );
            if (!connector) return false;

            // Find the stopNumber for the connector station on the target route
            const connectorStationStop = transferTarget.stationActivitySessions
                .find(sas => sas.stationId === connector.stationId)?.stopNumber;

            // Find the stopNumber for the child's drop-off station
            const dropOffStop = transferTarget.stationActivitySessions
                .find(sas => sas.stationId === child.dropOffStationId)?.stopNumber;

            // Keep only if connector comes before drop-off stop
            return (
                connectorStationStop != null &&
                dropOffStop != null &&
                connectorStationStop < dropOffStop
            );
        });

        const combined = [
            ...futureActivitySessionsSingleRoute.map(activitySession => {
                // Get stations before drop-off station
                const dropOffStation = activitySession.stationActivitySessions.find(sas => sas.stationId === child.dropOffStationId);
                const availablePickupStations = activitySession.stationActivitySessions
                    .filter(sas => sas.stopNumber < dropOffStation!.stopNumber)
                    .sort((a, b) => a.stopNumber - b.stopNumber)
                    .map(sas => ({
                        id: sas.station.id,
                        name: sas.station.name
                    }));

                return {
                    id: activitySession.id,
                    type: activitySession.type,
                    mode: activitySession.mode,
                    inLateRegistration: activitySession.inLateRegistration,
                    scheduledAt: activitySession.scheduledAt,
                    route: {
                        id: activitySession.route.id,
                        name: activitySession.route.name
                    },
                    requiresConnector: false,
                    availablePickupStations
                };
            }),
            
            ...futureActivitySessionsConnectorRoute.map(activitySession => {
                const transferTarget = futureActivitySessionsSingleRoute.find(
                    a => a.id === activitySession.activityTransferId
                );
                const connector = allRouteConnectors.find(conn =>
                    conn.fromRouteId === activitySession.routeId &&
                    conn.toRouteId === transferTarget?.routeId
                );
                const connectorStation = transferTarget?.stationActivitySessions.find(
                    sas => sas.stationId === connector?.stationId
                );

                // Get stations before connector station
                const connectorData = activitySession.stationActivitySessions.find(sas => sas.stationId === connectorStation?.stationId);
                const availablePickupStations = activitySession.stationActivitySessions
                    .filter(sas => sas.stopNumber < connectorData!.stopNumber)
                    .sort((a, b) => a.stopNumber - b.stopNumber)
                    .map(sas => ({
                        id: sas.station.id,
                        name: sas.station.name
                    }));

                return {
                    id: activitySession.id,
                    type: activitySession.type,
                    mode: activitySession.mode,
                    inLateRegistration: activitySession.inLateRegistration,
                    scheduledAt: activitySession.scheduledAt,
                    route: {
                        id: activitySession.route.id,
                        name: activitySession.route.name
                    },
                    requiresConnector: true,
                    connector: connector && connectorStation?.station
                        ? {
                            route: {
                                id: connector.toRoute.id,
                                name: connector.toRoute.name
                            },
                            station: {
                                id: connectorStation.station.id,
                                name: connectorStation.station.name
                            }
                        }
                        : undefined,
                    availablePickupStations,
                };
            })
        ];

        const responsePayload = combined.sort(
            (a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime()
        );


        return res.status(200).json({
            activities: responsePayload,
            dropOffStation: {
                id: child.dropOffStationId,
                name: child.dropOffStation.name
            }
        })
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
})


router.get('/upcoming-activities/:id', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const childId = req.params.id;
        const childExists = await AppDataSource.getRepository(Child).findOne({ where: { id: childId }, relations: { parentChildren: true } })
        if (!childExists) {
            return res.status(404).json({ message: "Child not found" });
        }
        if (!childExists.parentChildren.some(pc => pc.parentId === req.user!.userId)) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this child's information." });
        }

        const childData = await AppDataSource.getRepository(Child).findOne({
            where: {
                id: childId,
                childActivitySessions: {
                    activitySession: {
                        startedAt: IsNull()
                    }
                }
            },
            relations: {
                childActivitySessions: {
                    activitySession: {
                        stationActivitySessions: true,
                        route: true
                    },
                    parent: true,
                    pickUpStation: true,
                    dropOffStation: true
                }
            }
        })
        if (!childData) {
            return res.status(200).json([]);
        }

        const responsePayload: UpcomingActivitySessionInfo[] = childData.childActivitySessions.map(activityData => {
            return {
                activitySessionId: activityData.activitySessionId,
                isLateRegistration: activityData.isLateRegistration,
                registeredAt: activityData.registeredAt,
                activitySession: {
                    type: activityData.activitySession.type,
                    mode: activityData.activitySession.mode,
                    scheduledAt: activityData.activitySession.scheduledAt,
                    expectedDepartureAt: activityData.activitySession.stationActivitySessions.find(sas => sas.stationId === activityData.pickUpStationId)!.scheduledAt,
                    expectedArrivalAt: activityData.activitySession.stationActivitySessions.find(sas => sas.stationId === activityData.dropOffStationId)!.scheduledAt,
                },
                route: {
                    id: activityData.activitySession.routeId,
                    name: activityData.activitySession.route.name
                },
                pickUpStation: {
                    id: activityData.pickUpStationId,
                    name: activityData.pickUpStation.name
                },
                dropOffStation: {
                    id: activityData.dropOffStationId,
                    name: activityData.dropOffStation.name
                },
                registeredBy: {
                    id: activityData.parentId,
                    name: activityData.parent.name
                },
                chainedInfo: activityData.chainedActivitySessionId
            };
        });

        // Group by chainedInfo
        const grouped: Record<string, UpcomingActivitySessionInfo[]> = {};
        responsePayload.forEach(item => {
            const key = item.chainedInfo != null ? `chain-${item.chainedInfo}` : `single-${item.activitySessionId}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
        });

        // Build final payload
        const finalPayload: UpcomingActivityPayload[] = Object.values(grouped).map(group => {
            const chainedInfo = group[0]!.chainedInfo;
            if (chainedInfo !== null && group.length > 1) {
                // Sort bundle by registeredAt ascending
                const activities = group.slice().sort((a, b) => {
                    return a.registeredAt.getTime() - b.registeredAt.getTime();
                });
                return {
                    type: ActivityLinkType.BUNDLE,
                    activities
                };
            } else {
                // Single
                return {
                    type: ActivityLinkType.SINGLE,
                    ...group[0]!
                };
            }
        });

        // Sort all by expectedDepartureAt
        finalPayload.sort((a, b) => {
            const getExpectedDepartureAt = (item: UpcomingActivityPayload) => {
                if (item.type === ActivityLinkType.BUNDLE) {
                    return item.activities[0]!.activitySession.expectedDepartureAt.getTime();
                } else {
                    return item.activitySession.expectedDepartureAt.getTime();
                }
            };
            return getExpectedDepartureAt(a) - getExpectedDepartureAt(b);
        });

        return res.status(200).json(finalPayload);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
})


router.get('/ongoing-activities/:id', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const childId = req.params.id;
        const childExists = await AppDataSource.getRepository(Child).findOne({ where: { id: childId }, relations: { parentChildren: true } })
        if (!childExists) {
            return res.status(404).json({ message: "Child not found" });
        }
        if (!childExists.parentChildren.some(pc => pc.parentId === req.user!.userId)) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this child's information." });
        }

        const childData = await AppDataSource.getRepository(Child).findOne({
            where: {
                id: childId,
                childActivitySessions: {
                    activitySession: {
                        startedAt: Not(IsNull()),
                        finishedAt: IsNull()
                    }
                }
            },
            relations: {
                childActivitySessions: {
                    activitySession: {
                        stationActivitySessions: true,
                        route: true,
                        childStations: true
                    },
                    parent: true,
                    pickUpStation: true,
                    dropOffStation: true
                }
            }
        })
        if (!childData) {
            return res.status(200).json([]);
        }

        const responsePayload: OngoingActivitySessionInfo[] = childData.childActivitySessions.map(activityData => {
            return {
                activitySessionId: activityData.activitySessionId,
                isLateRegistration: activityData.isLateRegistration,
                registeredAt: activityData.registeredAt,
                activitySession: {
                    type: activityData.activitySession.type,
                    mode: activityData.activitySession.mode,
                    startedAt: activityData.activitySession.startedAt!,
                    expectedDepartureAt: activityData.activitySession.stationActivitySessions.find(sas => sas.stationId === activityData.pickUpStationId)!.scheduledAt,
                    departuredAt: activityData.activitySession.childStations.find(cs => cs.type === ChildStationType.IN && cs.childId === childId)?.registeredAt || null,
                    expectedArrivalAt: activityData.activitySession.stationActivitySessions.find(sas => sas.stationId === activityData.dropOffStationId)!.scheduledAt,
                    arrivedAt: activityData.activitySession.childStations.find(cs => cs.type === ChildStationType.OUT && cs.childId === childId)?.registeredAt || null,
                    weatherTemperature: activityData.activitySession.weatherTemperature,
                    weatherType: activityData.activitySession.weatherType
                },
                route: {
                    id: activityData.activitySession.routeId,
                    name: activityData.activitySession.route.name
                },
                pickUpStation: {
                    id: activityData.pickUpStationId,
                    name: activityData.pickUpStation.name
                },
                dropOffStation: {
                    id: activityData.dropOffStationId,
                    name: activityData.dropOffStation.name
                },
                registeredBy: {
                    id: activityData.parentId,
                    name: activityData.parent.name
                },
                chainedInfo: activityData.chainedActivitySessionId
            };
        });

        // Group by chainedInfo
        const grouped: Record<string, OngoingActivitySessionInfo[]> = {};
        responsePayload.forEach(item => {
            const key = item.chainedInfo != null ? `chain-${item.chainedInfo}` : `single-${item.activitySessionId}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
        });

        // Build final payload
        const finalPayload: OngoingActivityPayload[] = Object.values(grouped).map(group => {
            const chainedInfo = group[0]!.chainedInfo;
            if (chainedInfo !== null && group.length > 1) {
                // Sort bundle by registeredAt ascending
                const activities = group.slice().sort((a, b) => {
                    return a.registeredAt.getTime() - b.registeredAt.getTime();
                });
                return {
                    type: ActivityLinkType.BUNDLE,
                    activities
                };
            } else {
                // Single
                return {
                    type: ActivityLinkType.SINGLE,
                    ...group[0]!
                };
            }
        });

        // Sort all by expectedDepartureAt
        finalPayload.sort((a, b) => {
            const getExpectedDepartureAt = (item: OngoingActivityPayload) => {
                if (item.type === ActivityLinkType.BUNDLE) {
                    return item.activities[0]!.activitySession.expectedDepartureAt.getTime();
                } else {
                    return item.activitySession.expectedDepartureAt.getTime();
                }
            };
            return getExpectedDepartureAt(a) - getExpectedDepartureAt(b);
        });

        return res.status(200).json(finalPayload);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
})


router.get('/previous-activities/:id', authenticate, authorize(UserRole.PARENT), async (req: Request, res: Response) => {
    try {
        const childId = req.params.id;
        const childExists = await AppDataSource.getRepository(Child).findOne({ where: { id: childId }, relations: { parentChildren: true } })
        if (!childExists) {
            return res.status(404).json({ message: "Child not found" });
        }
        if (!childExists.parentChildren.some(pc => pc.parentId === req.user!.userId)) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this child's information." });
        }

        const childData = await AppDataSource.getRepository(Child).findOne({
            where: {
                id: childId,
                childActivitySessions: {
                    activitySession: {
                        finishedAt: Not(IsNull())
                    }
                }
            },
            relations: {
                childActivitySessions: {
                    activitySession: {
                        stationActivitySessions: true,
                        route: true,
                        childStations: true
                    },
                    parent: true,
                    pickUpStation: true,
                    dropOffStation: true
                },
                childStats: true
            }
        })
        if (!childData) {
            return res.status(200).json([]);
        }

        const responsePayload: PreviousActivitySessionInfo[] = childData.childActivitySessions.map(activityData => {
            const childStatsActivity = childData.childStats.find(cs => cs.activitySessionId == activityData.activitySessionId)

            return {
                activitySessionId: activityData.activitySessionId,
                isLateRegistration: activityData.isLateRegistration,
                registeredAt: activityData.registeredAt,
                activitySession: {
                    type: activityData.activitySession.type,
                    mode: activityData.activitySession.mode,
                    startedAt: activityData.activitySession.startedAt!,
                    departuredAt: activityData.activitySession.childStations.find(cs => cs.type === ChildStationType.IN && cs.childId === childId)!.registeredAt,
                    arrivedAt: activityData.activitySession.childStations.find(cs => cs.type === ChildStationType.OUT && cs.childId === childId)!.registeredAt,
                    finishedAt: activityData.activitySession.finishedAt!,
                    weatherTemperature: activityData.activitySession.weatherTemperature,
                    weatherType: activityData.activitySession.weatherType
                },
                route: {
                    id: activityData.activitySession.routeId,
                    name: activityData.activitySession.route.name
                },
                pickUpStation: {
                    id: activityData.pickUpStationId,
                    name: activityData.pickUpStation.name
                },
                dropOffStation: {
                    id: activityData.dropOffStationId,
                    name: activityData.dropOffStation.name
                },
                registeredBy: {
                    id: activityData.parentId,
                    name: activityData.parent.name
                },
                stats: {
                    distanceMeters: childStatsActivity?.distanceMeters || null,
                    co2Saved: childStatsActivity?.co2Saved || null,
                    caloriesBurned: childStatsActivity?.caloriesBurned || null,
                    pointsEarned: childStatsActivity?.pointsEarned || null
                },
                chainedInfo: activityData.chainedActivitySessionId
            };
        });

        // Group by chainedInfo
        const grouped: Record<string, PreviousActivitySessionInfo[]> = {};
        responsePayload.forEach(item => {
            const key = item.chainedInfo != null ? `chain-${item.chainedInfo}` : `single-${item.activitySessionId}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(item);
        });

        // Build final payload
        const finalPayload: PreviousActivityPayload[] = Object.values(grouped).map(group => {
            const chainedInfo = group[0]!.chainedInfo;
            if (chainedInfo !== null && group.length > 1) {
                // Sort bundle by registeredAt ascending
                const activities = group.slice().sort((a, b) => {
                    return a.registeredAt.getTime() - b.registeredAt.getTime();
                });
                return {
                    type: ActivityLinkType.BUNDLE,
                    activities
                };
            } else {
                // Single
                return {
                    type: ActivityLinkType.SINGLE,
                    ...group[0]!
                };
            }
        });

        // Sort all by expectedDepartureAt
        finalPayload.sort((a, b) => {
            const getExpectedDepartureAt = (item: PreviousActivityPayload) => {
                if (item.type === ActivityLinkType.BUNDLE) {
                    return item.activities[0]!.activitySession.arrivedAt.getTime();
                } else {
                    return item.activitySession.arrivedAt.getTime();
                }
            };
            return getExpectedDepartureAt(b) - getExpectedDepartureAt(a);
        });

        return res.status(200).json(finalPayload);
    } catch (error) {
        return res.status(500).json({ message: error instanceof Error ? error.message : String(error) });
    }
})


export default router;
