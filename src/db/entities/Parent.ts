import { Column, Entity, Index, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { Child } from "./Child";
import { ParentChild } from "./ParentChild";
import { ChildActivitySession } from "./ChildActivitySession";

@Entity()
export class Parent {
    @PrimaryGeneratedColumn("uuid")
    id!: string;
    
    @Column({ type: 'varchar' })
    name!: string;
    
    @Index()
    @Column({ type: 'varchar', unique: true })
    email!: string;

    @Column({ type: 'varchar', select: false })
    password!: string;

    @Column({ type: 'varchar' })
    phone!: string;

    @Column({ type: 'varchar' })
    address!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    updatedAt!: Date | null;

    @OneToMany(() => ParentChild, parentChild => parentChild.parent)
    parentChildren!: ParentChild[];

    @OneToMany(() => ChildActivitySession, childActivitySession => childActivitySession.parent)
    parentChildActivitySession!: ChildActivitySession[];
}
