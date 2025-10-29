import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Route } from "./Route";
import { Station } from "./Station";

@Entity()
export class RouteConnection {
    @PrimaryColumn({ type: 'varchar' })
    fromRouteId!: string;

    @PrimaryColumn({ type: 'varchar' })
    toRouteId!: string;
    
    @PrimaryColumn({ type: 'varchar' })
    stationId!: string;
    
    @ManyToOne(() => Route)
    fromRoute!: Route;

    @ManyToOne(() => Route)
    toRoute!: Route;

    @ManyToOne(() => Station)
    station!: Station;
}
