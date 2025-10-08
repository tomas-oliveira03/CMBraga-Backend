import { AppDataSource } from "@/db";
import { ActivitySession } from "@/db/entities/ActivitySession";
import { ChildActivitySession } from "@/db/entities/ChildActivitySession";
import { Child } from "@/db/entities/Child";
import { In, IsNull, Not } from "typeorm";
import { ChildStation } from "@/db/entities/ChildStation";

// Get current station id of an ongoing activity
export async function getCurrentStation(activitySessionId: string): Promise<string|null>{
    const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
        where: { 
            id: activitySessionId,
            stationActivitySessions: {
                arrivedAt: IsNull()
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
        return null
    }

    const stationId = activitySession.stationActivitySessions[0]?.stationId
    if (!stationId){
        return null
    }

    return stationId
}

// Get all station ids left an ongoing activity
export async function getAllStationsLeft(activitySessionId: string): Promise<string[]>{
    const activitySession = await AppDataSource.getRepository(ActivitySession).findOne({
        where: { 
            id: activitySessionId,
            stationActivitySessions: {
                arrivedAt: IsNull()
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
        return []
    }

    const stationIds = activitySession.stationActivitySessions
        .filter(sas => sas.arrivedAt === null)
        .map(sas => sas.stationId);            

    return stationIds
}


// Get all children at a pickup station on an ongoing activity
export async function getAllChildrenAtPickupStation(activitySessionId: string, currentStationId: string): Promise<Child[]>{
    const childActivitySessions = await AppDataSource.getRepository(ChildActivitySession).find({
        where: {
            activitySessionId: activitySessionId,
            pickUpStationId: currentStationId
        },
        relations: {
            child: true
        }
    })

    const allChildrenToPickUp = childActivitySessions.map(cas => cas.child)
    return allChildrenToPickUp
}

// Get all children at a pickup station on an ongoing activity
export async function getAllChildrenLeftToPickUp(activitySessionId: string, stationIds: string[]): Promise<{ currentStationChildren: Child[]; upcomingStationChildren: Child[] }> {
    
    if (stationIds.length === 0 || !stationIds[0]) {
        return { currentStationChildren: [], upcomingStationChildren: [] };
    }

    const currentStationId = stationIds[0];

    const childActivitySessions = await AppDataSource.getRepository(ChildActivitySession).find({
        where: {
            activitySessionId: activitySessionId,
            pickUpStationId: In(stationIds)
        },
        relations: {
            child: true
        },
    })

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
export async function getAllChildrenByPickupStatus(activitySessionId: string, currentStationId: string, allChildrenAtPickupStation: Child[], isAlreadyPickedUp: boolean): Promise<Child[]>{
    const pickedUpChildren = await AppDataSource.getRepository(ChildStation).find({
        where: {
            activitySessionId: activitySessionId,
            stationId: currentStationId,
            childId: In(allChildrenAtPickupStation.map(acp=> acp.id)),
        },
        select: {
            childId: true
        }
    })

    const pickedUpChildrenIds = new Set(pickedUpChildren.map(puc => puc.childId));

    const filteredChildren = allChildrenAtPickupStation.filter(child => {
        const wasPickedUp = pickedUpChildrenIds.has(child.id);
        return isAlreadyPickedUp ? wasPickedUp : !wasPickedUp;
    });

    return filteredChildren
}


// Get all chidren at a dropoff station on an ongoing activity that were
// isAlreadyDroppedOff = True => already dropped off
// isAlreadyDroppedOff = False => not yet dropped off
export async function getAllChildrenByDroppedOffStatus(activitySessionId: string, currentStationId: string, isAlreadyDroppedOff: boolean){
    const droppedOffChildren = await AppDataSource.getRepository(Child).find({
        where:{
            dropOffStationId: currentStationId,
            childStations:{
                activitySessionId: activitySessionId
            }
        },
        relations: {
            childStations: true
        }
    })

    if(isAlreadyDroppedOff){
        const filteredChildren = droppedOffChildren.filter(
            child => child.childStations.length === 2
        )
        return filteredChildren
    }
    
    const filteredChildren = droppedOffChildren.filter(
        child => child.childStations.length === 1
    )
    return filteredChildren

}


export async function getAllChildrenYetToBeDroppedOff(activitySessionId: string, stationIds: string[]): Promise<Child[]>{
    
    if (stationIds.length === 0 || !stationIds[0]) {
        return []
    }

    const currentStationId = stationIds[0];

    const allChildrenNotInStation = await AppDataSource.getRepository(Child).find({
        where: {
            dropOffStationId: Not(currentStationId),
            childStations: {
                activitySessionId: activitySessionId
            },

        },
        relations: {
            childStations: true
        }
    })

    const childrenToBeDroppedOffNotSorted = allChildrenNotInStation.filter(
        child => child.childStations.length === 1 && child.childStations[0]?.stationId !== currentStationId
    )

    const childrenToBeDroppedOff = childrenToBeDroppedOffNotSorted.sort((a, b) => {
        const orderA = stationIds.indexOf(a.dropOffStationId);
        const orderB = stationIds.indexOf(b.dropOffStationId);
        return orderA - orderB;
    });

    return childrenToBeDroppedOff

}



export async function getAllChildrenAlreadyDroppedOff(activitySessionId: string, currentStationId: string){
    
    const allChildrenNotInStation = await AppDataSource.getRepository(Child).find({
        where: {
            dropOffStationId: Not(currentStationId),
            childStations: {
                activitySessionId: activitySessionId
            },

        },
        relations: {
            childStations: true
        }
    })

    const childrenAlreadyDroppedOff = allChildrenNotInStation.filter(
        child => child.childStations.length === 2
    )

    return childrenAlreadyDroppedOff

}



export const stripChildStations = (children: any[]) =>
  children.map(({ childStations, ...rest }) => rest);