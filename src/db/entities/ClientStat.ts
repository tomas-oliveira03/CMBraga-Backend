import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { Parent } from "./Parent";
import { Child } from "./Child";
import { ActivitySession } from "./ActivitySession";

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

    @Column({ type: 'timestamptz' })
    activityDate!: Date;

    @Column({ type: 'varchar', nullable: true })
    parentId!: string | null;

    @Column({ type: 'varchar', nullable: true })
    childId!: string | null;

    @Column({ type: 'varchar' })
    activitySessionId!: string;

    @ManyToOne(() => Parent, { nullable: true })
    parent!: Parent | null;

    @ManyToOne(() => Child, { nullable: true })
    child!: Child | null;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;
}
