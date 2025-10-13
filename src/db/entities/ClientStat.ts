import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { Parent } from "./Parent";
import { Child } from "./Child";

@Entity()
export class ClientStat {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    parentId!: string;

    @Column({ type: 'uuid', nullable: true })
    childId!: string;

    @Column({ type: 'int', default: 0 })
    metersWalked!: number;

    @Column({ type: 'int', default: 0 })
    co2Saved!: number;

    @Column({ type: 'int', default: 0 })
    caloriesBurned!: number;

    @Column({ type: 'date' })
    date!: string;

    @Column({ type: 'uuid' })
    activitySessionId!: string;

    @OneToOne(() => Parent, {nullable: true})
    parent!: Parent | null;

    @OneToOne(() => Child, {nullable: true})
    child!: Child | null;
}
