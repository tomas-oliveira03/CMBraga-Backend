import { Entity, PrimaryColumn, ManyToOne, PrimaryGeneratedColumn, Column } from "typeorm"
import { User } from "./User";
import { Badge } from "./Badge";
import { Parent } from "./Parent";
import { Child } from "./Child";

@Entity()
export class ClientBadge {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'varchar', nullable: true })
    parentId!: string;

    @Column({ type: 'varchar', nullable: true })
    childId!: string;

    @Column({ type: 'varchar' })
    badgeId!: string;
    
    @ManyToOne(() => Parent)
    parent!: Parent | null;

    @ManyToOne(() => Child)
    child!: Child | null;

    @ManyToOne(() => Badge)
    badge!: Badge | null;
}