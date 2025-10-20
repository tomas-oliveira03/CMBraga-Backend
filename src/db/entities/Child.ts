import { Check, Column, Entity, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { ChildActivitySession } from "./ChildActivitySession";
import { ChildStation } from "./ChildStation";
import { MedicalReport } from "./MedicalReport";
import { ParentChild } from "./ParentChild";
import { ChildGender, ChildHealthProblems } from "@/helpers/types";
import { Station } from "./Station";
import { ChildActivityRecord } from "./ChildActivityRecord";
import { Feedback } from "./Feedback";
import { ClientStat } from "./ClientStat";
import { ChildHistory } from "./ChildHistory";

@Entity()
@Check(`"gender" IN ('male', 'female')`)
export class Child {
	@PrimaryGeneratedColumn("uuid")
	id!: string;

	@Column({ type: 'varchar' })
	name!: string;

	@Column({ type: 'varchar' })
    profilePictureURL!: string;

	@Column({ type: 'varchar' })
	gender!: ChildGender;

	@Column({ type: 'int'})
	heightCentimeters!: number;

	@Column({ type: 'int'})
	weightKilograms!: number; 

	@Column({ type: 'varchar' })
	school!: string;

	@Column({ type: 'int' })
	schoolGrade!: number;
	
	// Station where the child is dropped off to school
	@Column({ type: 'varchar' })
	dropOffStationId!: string;

	@Column({ type: 'date' })
	dateOfBirth!: Date;

	@Column({ type: 'jsonb', nullable: true })
	healthProblems!: ChildHealthProblems;

	@Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date;

	@Column({ type: 'timestamptz', nullable: true })
	updatedAt!: Date | null;

	@OneToMany(() => ChildActivitySession, childActivitySession => childActivitySession.child)
	childActivitySessions!: ChildActivitySession[];

	@OneToMany(() => ChildActivityRecord, childActivityRecord => childActivityRecord.child)
	childActivityRecords!: ChildActivitySession[];

	@OneToMany(() => ChildStation, childStation => childStation.child)
	childStations!: ChildStation[];

	@OneToMany(() => MedicalReport, medicalReport => medicalReport.child)
	medicalReports!: MedicalReport[];

	@OneToMany(() => ParentChild, parentChild => parentChild.child)
	parentChildren!: ParentChild[];

	@OneToMany(() => Feedback, (feedback) => feedback.child)
	feedbacks!: Feedback[];

	@OneToMany(() => ClientStat, (cs) => cs.child)
	clientStats!: ClientStat[];

	@OneToMany(() => ChildHistory, (ch) => ch.child)
	childHistory!: ChildHistory[];

	@ManyToOne(() => Station)
	dropOffStation!: Station;
}

