import { Column, Entity, Index, OneToMany, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { InstructorActivitySession } from "./InstructorActivitySession"
import { Issue } from "./Issue";
import { ChildStation } from "./ChildStation";
import { ActivitySession } from "./ActivitySession";
import { User } from "./User";

@Entity()
export class Instructor {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'varchar' })
    name!: string;

    @Index()
    @Column({ type: 'varchar', unique: true })
    email!: string;

    @Column({ type: 'varchar', nullable: true, select: false })
    password!: string;

    @Column({ type: 'varchar' })
    profilePictureURL!: string;

    @Column({ type: 'varchar' })
    phone!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', nullable: true})
    activatedAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    updatedAt!: Date | null;

    @OneToMany(() => InstructorActivitySession, instructorActivitySession => instructorActivitySession.instructor)
    instructorActivitySessions!: InstructorActivitySession[];

    @OneToMany(() => Issue, (issue) => issue.instructor)
    issues!: Issue[];

    @OneToMany(() => ChildStation, childStation => childStation.instructor)
    childStations!: ChildStation[];

    @OneToMany(() => ActivitySession, activitySession => activitySession.startedBy)
    startedActivitySessions!: ActivitySession[];

    @OneToMany(() => ActivitySession, activitySession => activitySession.finishedBy)
    finishedActivitySessions!: ActivitySession[];

    @OneToOne(() => User)
    user!: User;
}
