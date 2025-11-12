import { ActivityType, RouteColor, RoutePoint } from "@/helpers/types";
import { Check, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm"
import { ActivitySession } from "./ActivitySession";
import { RouteStation } from "./RouteStation";
import { RouteConnection } from "./RouteConnection";

@Entity()
@Check(`"activity_type" IN ('pedibus', 'ciclo_expresso')`)
@Check(`"color" IN ('red', 'blue', 'green', 'yellow', 'orange', 'purple')`)
export class Route {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'varchar', unique: true })
    name!: string;

    @Column({ type: 'varchar' })
    activityType!: ActivityType;

    @Column({ type: 'varchar' })
    color!: RouteColor;

    @Column({ type: 'int' })
    distanceMeters!: number;

    @Column({ type: 'float' })
    boundsNorth!: number;

    @Column({ type: 'float' })
    boundsEast!: number;

    @Column({ type: 'float' })
    boundsSouth!: number;

    @Column({ type: 'float' })
    boundsWest!: number;

    @Column({ type: 'jsonb' })
    metadata!: RoutePoint[];

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;
    
    @Column({ type: 'timestamptz', nullable: true })
	updatedAt!: Date | null;

    @OneToMany(() => ActivitySession, (activitySession) => activitySession.route)
    activitySessions!: ActivitySession[];

    @OneToMany(() => RouteStation, (routeStation) => routeStation.route)
    routeStations!: RouteStation[];

    @OneToMany(() => RouteConnection, (routeConnection) => routeConnection.fromRoute)
    fromRouteConnections!: RouteConnection[];

    @OneToMany(() => RouteConnection, (routeConnection) => routeConnection.toRoute)
    toRouteConnections!: RouteConnection[];
}
