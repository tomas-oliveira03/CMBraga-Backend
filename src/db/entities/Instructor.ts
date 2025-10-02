import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm"
import { InstructorActivitySession } from "./InstructorActivitySession"
import { Issue } from "./Issue";

@Entity()
export class Instructor {
    @PrimaryColumn({ type: 'varchar' })
    id!: string;

    @Column({ type: 'varchar' })
    name!: string;

    @Column({ type: 'varchar' })
    email!: string;

    @Column({ type: 'varchar' })
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
}
