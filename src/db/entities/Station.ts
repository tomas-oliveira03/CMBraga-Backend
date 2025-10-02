import { Check, Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { StationActivitySession } from "./StationActivitySession"
import { ChildStation } from "./ChildStation"

export enum StationType {
    REGULAR = 'regular',
    SCHOOL = 'school'
}

@Entity()
@Check(`"type" IN ('regular', 'school')`)
export class Station {
    @PrimaryGeneratedColumn("uuid")
    id!: string;
    
    @Column({ type: 'varchar' })
    name!: string;

    @Column({ type: 'int' })
    stopNumber!: number;

    @Column({ type: 'varchar' })
    type!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date;

	@Column({ type: 'timestamptz', nullable: true })
	updatedAt!: Date | null;

    @OneToMany(() => StationActivitySession, stationActivitySession => stationActivitySession.station)
    stationActivitySessions!: StationActivitySession[];

    @OneToMany(() => ChildStation, childStation => childStation.station)
    childStations!: ChildStation[];
}
