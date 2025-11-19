import { Column, Entity, Index, ManyToOne, PrimaryGeneratedColumn } from "typeorm"
import { Child } from "./Child";
import { Parent } from "./Parent";
import { QuestionnaireSurvey } from "@/helpers/survey-questions";
import { SurveyType } from "@/helpers/types";

@Entity()
export class Survey {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'varchar' })
    type!: SurveyType;

    @Index()
    @Column({ type: 'varchar' })
    parentId!: string;

    @Index()
    @Column({ type: 'varchar' })
    childId!: string;

    @Column({ type: 'jsonb' })
    answers!: Record<number, number>[];

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    submittedAt!: Date;

    @ManyToOne(() => Parent)
    parent!: Parent;

    @ManyToOne(() => Child)
    child!: Child;
}
