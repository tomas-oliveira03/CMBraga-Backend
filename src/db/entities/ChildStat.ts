import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, OneToOne, PrimaryColumn, Index } from "typeorm"
import { Child } from "./Child";
import { ActivitySession } from "./ActivitySession";
import { ParentStat } from "./ParentStat";

@Entity()
export class ChildStat {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'int' })
    distanceMeters!: number;

    @Column({ type: 'int' })
    co2Saved!: number;

    @Column({ type: 'int' })
    caloriesBurned!: number;

    @Column({ type: 'int' })
    pointsEarned!: number;

    @Column({ type: 'timestamptz' })
    activityDate!: Date;

    @Column({ type: 'varchar' })
    activitySessionId!: string;

    @Index()
    @Column({ type: 'varchar' })
    childId!: string | null;

    @ManyToOne(() => Child)
    child!: Child | null;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;

    @OneToOne(() => ParentStat, (ps) => ps.childStat, { nullable: true })
    parentStat!: ParentStat | null;
}
