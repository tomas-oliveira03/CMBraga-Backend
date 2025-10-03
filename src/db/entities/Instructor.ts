import { Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { InstructorActivitySession } from "./InstructorActivitySession"
import { Issue } from "./Issue";
import { ChildStation } from "./ChildStation";

@Entity()
export class Instructor {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'varchar' })
    name!: string;

    @Column({ type: 'varchar' })
    email!: string;

    @Column({ type: 'varchar', select: false })
    password!: string;

    @Column({ type: 'varchar' })
    phone!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    updatedAt!: Date | null;

    @OneToMany(() => InstructorActivitySession, instructorActivitySession => instructorActivitySession.instructor)
    instructorActivitySessions!: InstructorActivitySession[];

    @OneToMany(() => Issue, (issue) => issue.instructor)
    issues!: Issue[];

    @OneToMany(() => ChildStation, childStation => childStation.instructor)
    childStations!: ChildStation[];
}
