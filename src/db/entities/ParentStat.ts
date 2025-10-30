import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, OneToOne, JoinColumn } from "typeorm";
import { Parent } from "./Parent";
import { ChildStat } from "./ChildStat";

@Entity()
export class ParentStat {
    @PrimaryGeneratedColumn("uuid")
    parentId!: string;

    @PrimaryGeneratedColumn("uuid")
    childStatId!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @ManyToOne(() => Parent, { nullable: false })
    parent!: Parent;

    @OneToOne(() => ChildStat, { nullable: false })
    childStat!: ChildStat;
}
