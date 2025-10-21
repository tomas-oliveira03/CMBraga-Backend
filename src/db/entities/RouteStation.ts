import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Child } from "./Child";
import { Parent } from "./Parent";
import { Route } from "./Route";
import { Station } from "./Station";

@Entity()
export class RouteStation {
    @PrimaryColumn({ type: 'varchar' })
    routeId!: string;

    @PrimaryColumn({ type: 'varchar' })
    stationId!: string;

    @Column({ type: 'int' })
    stopNumber!: number;

    @Column({ type: 'float' })
    distanceFromStartMeters!: number; 

    @Column({ type: 'int' })
    timeFromStartMinutes!: number;

    @Column({ type: 'int' })
    distanceFromPreviousStationMeters!: number; 

    @ManyToOne(() => Route)
    route!: Route;

    @ManyToOne(() => Station)
    station!: Station;
}
