import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, OneToOne, JoinColumn } from "typeorm";
import { Parent } from "./Parent";
import { ClientStat } from "./ClientStat";

@Entity()
export class ParentStat {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'varchar' })
    parentId!: string;

    @Column({ type: 'varchar' })
    clientStatId!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @ManyToOne(() => Parent, { nullable: false })
    parent!: Parent;

    @OneToOne(() => ClientStat, { nullable: false })
    clientStat!: ClientStat;
}
