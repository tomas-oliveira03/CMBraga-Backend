import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm"
import { User } from "./User";
import { Child } from "./Child";

@Entity()
export class UserStat {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'uuid', nullable: true })
    parentid!: string;

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

    @OneToOne(() => User, {nullable: true})
    user!: User | null;

    @OneToOne(() => Child, {nullable: true})
    child!: Child | null;
}
