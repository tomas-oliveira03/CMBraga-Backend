import { Check, Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { StationActivitySession } from "./StationActivitySession"
import { ChildStation } from "./ChildStation"
import { StationType } from "@/helpers/types";
import { Child } from "./Child";
import { ChildActivitySession } from "./ChildActivitySession";

@Entity()
@Check(`"type" IN ('regular', 'school')`)
export class Station {
    @PrimaryGeneratedColumn("uuid")
    id!: string;
    
    @Column({ type: 'varchar' })
    name!: string;

    @Column({ type: 'varchar' })
    type!: StationType;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date;

	@Column({ type: 'timestamptz', nullable: true })
	updatedAt!: Date | null;

    @OneToMany(() => StationActivitySession, stationActivitySession => stationActivitySession.station)
    stationActivitySessions!: StationActivitySession[];

    @OneToMany(() => ChildStation, childStation => childStation.station)
    childStations!: ChildStation[];

    @OneToMany(() => Child, child => child.dropOffStation)
	dropOffStationChildren!: Child[];

    @OneToMany(() => ChildActivitySession, childActivitySession => childActivitySession.pickUpStation)
	pickUpchildActivitySessions!: ChildActivitySession[];
}
