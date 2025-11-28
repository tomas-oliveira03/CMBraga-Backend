import { Check, Column, Entity, ManyToOne, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { ChildActivitySession } from "./ChildActivitySession";
import { ChildStation } from "./ChildStation";
import { MedicalReport } from "./MedicalReport";
import { ParentChild } from "./ParentChild";
import { ChildGender } from "@/helpers/types";
import { Station } from "./Station";
import { ChildStat } from "./ChildStat";
import { ChildHistory } from "./ChildHistory";
import { Survey } from "./Survey";

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

	@Column({ type: 'int', nullable: true, default: null })
	heightCentimeters!: number | null;

	@Column({ type: 'int', nullable: true, default: null })
	weightKilograms!: number | null; 

	@Column({ type: 'int', nullable: true, default: null })
	cortisolLevel!: number | null;

	@Column({ type: 'varchar' })
	school!: string;

	@Column({ type: 'int' })
	schoolGrade!: number;
	
	// Station where the child is dropped off to school
	@Column({ type: 'varchar' })
	dropOffStationId!: string;

	@Column({ type: 'date' })
	dateOfBirth!: Date;

	@Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date;

	@Column({ type: 'timestamptz', nullable: true })
	updatedAt!: Date | null;

	@OneToMany(() => ChildActivitySession, childActivitySession => childActivitySession.child)
	childActivitySessions!: ChildActivitySession[];

	@OneToMany(() => ChildStation, childStation => childStation.child)
	childStations!: ChildStation[];

	@OneToMany(() => MedicalReport, medicalReport => medicalReport.child)
	medicalReports!: MedicalReport[];

	@OneToMany(() => ParentChild, parentChild => parentChild.child)
	parentChildren!: ParentChild[];

	@OneToMany(() => ChildStat, (cs) => cs.child)
	childStats!: ChildStat[];

	@OneToMany(() => ChildHistory, (ch) => ch.child)
	childHistory!: ChildHistory[];

	@OneToMany(() => Survey, (cs) => cs.child)
	childSurveys!: Survey[];

	@ManyToOne(() => Station)
	dropOffStation!: Station;
}

