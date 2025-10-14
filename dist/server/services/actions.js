"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripChildStations = void 0;
exports.getCurrentStationId = getCurrentStationId;
exports.getAllStationsLeftIds = getAllStationsLeftIds;
exports.getAllChildrenAtPickupStation = getAllChildrenAtPickupStation;
exports.getAllChildrenLeftToPickUp = getAllChildrenLeftToPickUp;
exports.getAllChildrenByPickupStatus = getAllChildrenByPickupStatus;
exports.getAllChildrenByDroppedOffStatus = getAllChildrenByDroppedOffStatus;
exports.getAllChildrenYetToBeDroppedOff = getAllChildrenYetToBeDroppedOff;
exports.getAllChildrenAlreadyDroppedOff = getAllChildrenAlreadyDroppedOff;
const db_1 = require("../../db");
const ActivitySession_1 = require("../../db/entities/ActivitySession");
const ChildActivitySession_1 = require("../../db/entities/ChildActivitySession");
const Child_1 = require("../../db/entities/Child");
const typeorm_1 = require("typeorm");
const ChildStation_1 = require("../../db/entities/ChildStation");
// Get current station id of an ongoing activity
async function getCurrentStationId(activitySessionId) {
    const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
        where: {
            id: activitySessionId,
            stationActivitySessions: {
                leftAt: (0, typeorm_1.IsNull)()
            }
        },
        order: {
            stationActivitySessions: {
                stopNumber: "ASC"
            }
        },
        relations: {
            stationActivitySessions: {
                station: true
            }
        }
    });
    if (!activitySession) {
        return null;
    }
    const stationId = activitySession.stationActivitySessions[0]?.stationId;
    if (!stationId) {
        return null;
    }
    return stationId;
}
// Get all station ids left an ongoing activity
async function getAllStationsLeftIds(activitySessionId) {
    const activitySession = await db_1.AppDataSource.getRepository(ActivitySession_1.ActivitySession).findOne({
        where: {
            id: activitySessionId,
            stationActivitySessions: {
                leftAt: (0, typeorm_1.IsNull)()
            }
        },
        order: {
            stationActivitySessions: {
                stopNumber: "ASC"
            }
        },
        relations: {
            stationActivitySessions: {
                station: true
            }
        }
    });
    if (!activitySession) {
        return [];
    }
    const stationIds = activitySession.stationActivitySessions
        .map(sas => sas.stationId);
    return stationIds;
}
// Get all children at a pickup station on an ongoing activity
async function getAllChildrenAtPickupStation(activitySessionId, currentStationId) {
    const childActivitySessions = await db_1.AppDataSource.getRepository(ChildActivitySession_1.ChildActivitySession).find({
        where: {
            activitySessionId: activitySessionId,
            pickUpStationId: currentStationId
        },
        relations: {
            child: true
        }
    });
    const allChildrenToPickUp = childActivitySessions.map(cas => cas.child);
    return allChildrenToPickUp;
}
// Get all children at a pickup station on an ongoing activity
async function getAllChildrenLeftToPickUp(activitySessionId, stationIds) {
    if (stationIds.length === 0 || !stationIds[0]) {
        return { currentStationChildren: [], upcomingStationChildren: [] };
    }
    const currentStationId = stationIds[0];
    const childActivitySessions = await db_1.AppDataSource.getRepository(ChildActivitySession_1.ChildActivitySession).find({
        where: {
            activitySessionId: activitySessionId,
            pickUpStationId: (0, typeorm_1.In)(stationIds)
        },
        relations: {
            child: true
        },
    });
    const currentStationChildren = childActivitySessions
        .filter(cas => cas.pickUpStationId === currentStationId)
        .map(cas => cas.child);
    const upcomingStationChildren = childActivitySessions
        .filter(cas => cas.pickUpStationId !== currentStationId)
        .sort((a, b) => stationIds.indexOf(a.pickUpStationId) - stationIds.indexOf(b.pickUpStationId))
        .map(cas => cas.child);
    return {
        currentStationChildren: currentStationChildren,
        upcomingStationChildren: upcomingStationChildren,
    };
}
// Get all chidren at a pickup station on an ongoing activity that were
// isAlreadyPickedUp = True => already picked up
// isAlreadyPickedUp = False => not yet picked up
async function getAllChildrenByPickupStatus(activitySessionId, currentStationId, allChildrenAtPickupStation, isAlreadyPickedUp) {
    const pickedUpChildren = await db_1.AppDataSource.getRepository(ChildStation_1.ChildStation).find({
        where: {
            activitySessionId: activitySessionId,
            stationId: currentStationId,
            childId: (0, typeorm_1.In)(allChildrenAtPickupStation.map(acp => acp.id)),
        },
        select: {
            childId: true
        }
    });
    const pickedUpChildrenIds = new Set(pickedUpChildren.map(puc => puc.childId));
    const filteredChildren = allChildrenAtPickupStation.filter(child => {
        const wasPickedUp = pickedUpChildrenIds.has(child.id);
        return isAlreadyPickedUp ? wasPickedUp : !wasPickedUp;
    });
    return filteredChildren;
}
// Get all chidren at a dropoff station on an ongoing activity that were
// isAlreadyDroppedOff = True => already dropped off
// isAlreadyDroppedOff = False => not yet dropped off
async function getAllChildrenByDroppedOffStatus(activitySessionId, currentStationId, isAlreadyDroppedOff) {
    const droppedOffChildren = await db_1.AppDataSource.getRepository(Child_1.Child).find({
        where: {
            dropOffStationId: currentStationId,
            childStations: {
                activitySessionId: activitySessionId
            }
        },
        relations: {
            childStations: true
        }
    });
    if (isAlreadyDroppedOff) {
        const filteredChildren = droppedOffChildren.filter(child => child.childStations.length === 2);
        return filteredChildren;
    }
    const filteredChildren = droppedOffChildren.filter(child => child.childStations.length === 1);
    return filteredChildren;
}
async function getAllChildrenYetToBeDroppedOff(activitySessionId, stationIds) {
    if (stationIds.length === 0 || !stationIds[0]) {
        return [];
    }
    const currentStationId = stationIds[0];
    const allChildrenNotInStation = await db_1.AppDataSource.getRepository(Child_1.Child).find({
        where: {
            dropOffStationId: (0, typeorm_1.Not)(currentStationId),
            childStations: {
                activitySessionId: activitySessionId
            },
        },
        relations: {
            childStations: true
        }
    });
    const childrenToBeDroppedOffNotSorted = allChildrenNotInStation.filter(child => child.childStations.length === 1 && child.childStations[0]?.stationId !== currentStationId);
    const childrenToBeDroppedOff = childrenToBeDroppedOffNotSorted.sort((a, b) => {
        const orderA = stationIds.indexOf(a.dropOffStationId);
        const orderB = stationIds.indexOf(b.dropOffStationId);
        return orderA - orderB;
    });
    return childrenToBeDroppedOff;
}
async function getAllChildrenAlreadyDroppedOff(activitySessionId, currentStationId) {
    const allChildrenNotInStation = await db_1.AppDataSource.getRepository(Child_1.Child).find({
        where: {
            dropOffStationId: (0, typeorm_1.Not)(currentStationId),
            childStations: {
                activitySessionId: activitySessionId
            },
        },
        relations: {
            childStations: true
        }
    });
    const childrenAlreadyDroppedOff = allChildrenNotInStation.filter(child => child.childStations.length === 2);
    return childrenAlreadyDroppedOff;
}
const stripChildStations = (children) => children.map(({ childStations, ...rest }) => rest);
exports.stripChildStations = stripChildStations;
