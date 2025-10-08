import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { ActivitySession } from "./ActivitySession";
import { Child } from "./Child";

@Entity()
export class ChildActivityRecord {
    @PrimaryColumn({ type: 'varchar' })
    childId!: string;

    @PrimaryColumn({ type: 'varchar' })
    activitySessionId!: string;

    @Column({ type: 'int' })
    distanceMeters!: number;
    
    @Column({ type: 'int' })
    durationSeconds!: number;

    @Column({ type: 'int' })
    caloriesBurned!: number;

    @ManyToOne(() => Child)
    child!: Child;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;
}
