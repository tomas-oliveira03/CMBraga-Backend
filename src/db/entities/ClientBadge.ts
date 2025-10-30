import { Entity, PrimaryColumn, ManyToOne, PrimaryGeneratedColumn, Column, Index } from "typeorm"
import { User } from "./User";
import { Badge } from "./Badge";
import { Parent } from "./Parent";
import { Child } from "./Child";

@Entity()
export class ClientBadge {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Index()
    @Column({ type: 'varchar', nullable: true })
    parentId!: string | null;

    @Index()
    @Column({ type: 'varchar', nullable: true })
    childId!: string | null;

    @Index()
    @Column({ type: 'varchar' })
    badgeId!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    assignedAt!: Date;
    
    @ManyToOne(() => Parent, { nullable: true })
    parent!: Parent | null;

    @ManyToOne(() => Child, { nullable: true })
    child!: Child | null;

    @ManyToOne(() => Badge)
    badge!: Badge;
}