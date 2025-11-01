import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, OneToOne, JoinColumn, PrimaryColumn } from "typeorm";
import { Parent } from "./Parent";
import { ChildStat } from "./ChildStat";

@Entity()
export class ParentStat {
    @PrimaryColumn("uuid")
    parentId!: string;

    @PrimaryColumn("uuid")
    childStatId!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @ManyToOne(() => Parent)
    parent!: Parent;

    @OneToOne(() => ChildStat)
    childStat!: ChildStat;
}
