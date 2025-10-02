import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Station } from "./Station"
import { ActivitySession } from "./ActivitySession"

@Entity()
export class StationActivitySession {
    @PrimaryColumn({ type: 'varchar' })
    stationId!: string;

    @PrimaryColumn({ type: 'varchar' })
    activitySessionId!: string;

    @Column({ type: 'timestamptz' })
    scheduledAt!: Date;

    @Column({ type: 'timestamptz' })
    arrivedAt!: Date;

    @ManyToOne(() => Station)
    station!: Station;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;
}
