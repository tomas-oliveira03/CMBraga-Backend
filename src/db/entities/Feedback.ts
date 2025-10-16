import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Child } from "./Child";
import { Parent } from "./Parent";
import { ActivitySession } from "./ActivitySession";


@Entity()
export class Feedback {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: "int" })
    evaluation1!: number;

    @Column({ type: "int" })
    evaluation2!: number;

    @Column({ type: "int" })
    evaluation3!: number;

    @Column({ type: "int" })
    evaluation4!: number;

    @Column({ type: "int" })
    evaluation5!: number;

    @Column({ type: "varchar" })
    textFeedback!: string;

    @Column({ type: "int" })
    overallRating!: number;

    @Column({ type: "varchar" })
    activitySessionId!: string;

    @Column({ type: "varchar" })
    childId!: string;

    @Column({ type: "varchar" })
    parentId!: string;

    @Column({ type: 'timestamptz',  default: () => 'CURRENT_TIMESTAMP' })
    submitedAt!: Date;

    @ManyToOne(() => ActivitySession)
    activitySession!: ActivitySession;

    @ManyToOne(() => Child)
    child!: Child;

    @ManyToOne(() => Parent)
    parent!: Parent;

}
