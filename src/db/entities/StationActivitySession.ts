import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Station } from "./Station"
import { ActivitySession } from "./ActivitySession"

@Entity()
export class StationActivitySession {
    @PrimaryColumn({ type: 'varchar' })
    stationId!: string;

    @PrimaryColumn({ type: 'varchar' })
    activitySessionId!: string;

    @Column({ type: 'int' })
    stopNumber!: number;

    @Column({ type: 'timestamptz' })
    scheduledAt!: Date;

    @Column({ type: 'timestamptz', nullable:true })
    arrivedAt!: Date | null;

    @Column({ type: 'timestamptz', nullable:true })
    leftAt!: Date | null;

    @ManyToOne(() => Station)
    station!: Station;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;
}
