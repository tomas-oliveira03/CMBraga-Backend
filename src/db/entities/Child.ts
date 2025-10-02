import { Check, Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from "typeorm"
import { Parent } from "./Parent";
import { ChildActivitySession } from "./ChildActivitySession";
import { ChildStation } from "./ChildStation";

export enum Gender {
	MALE = 'male',
	FEMALE = 'female'
}

// MOCKED DATA
export type HealthProblems = {
	allergies?: string[];
	chronicDiseases?: string[];
	surgeries?: { type: string; year: number }[];
};

@Entity()
@Check(`"gender" IN ('male', 'female')`)
export class Child {
	@PrimaryColumn({ type: 'varchar' })
	id!: string;

	@Column({ type: 'varchar' })
	name!: string;

	@Column({ type: 'varchar' })
	gender!: Gender;

	@Column({ type: 'varchar' })
	school!: string;

	@Column({ type: 'date' })
	dateOfBirth!: Date;

	@Column({ type: 'jsonb', nullable: true })
	healthProblems!: HealthProblems;

	@Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
	createdAt!: Date;

	@Column({ type: 'timestamptz', nullable: true })
	updatedAt!: Date | null;

	@Column({ type: 'varchar'})
	parentId!: string;

	@ManyToOne(() => Parent)
	parent!: Parent;

	@OneToMany(() => ChildActivitySession, childActivitySession => childActivitySession.child)
	childActivitySessions!: ChildActivitySession[];

	@OneToMany(() => ChildStation, childStation => childStation.child)
	childStations!: ChildStation[];
}
