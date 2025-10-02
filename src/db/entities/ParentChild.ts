import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm"
import { Parent } from "./Parent"
import { Child } from "./Child"

@Entity()
export class ParentChild {
    @PrimaryColumn({ type: 'varchar' })
    parentId!: string;

    @PrimaryColumn({ type: 'varchar' })
    childId!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    associatedAt!: Date;

    @ManyToOne(() => Parent)
    parent!: Parent;

    @ManyToOne(() => Child)
    child!: Child;
}
