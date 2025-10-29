import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, OneToOne } from "typeorm"
import { Child } from "./Child";
import { ActivitySession } from "./ActivitySession";
import { ParentStat } from "./ParentStat";

@Entity()
export class ClientStat {
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
    
    @Column({ type: 'varchar', nullable: true })
    childId!: string | null;

    @ManyToOne(() => Child, { nullable: true })
    child!: Child | null;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;

    @OneToOne(() => ParentStat, (ps) => ps.clientStat, { nullable: true })
    parentStat!: ParentStat | null;
}
