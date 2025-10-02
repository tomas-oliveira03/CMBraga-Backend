import { Column, Entity, OneToMany, PrimaryColumn } from "typeorm"
import { Child } from "./Child";
import { ParentChild } from "./ParentChild";

@Entity()
export class Parent {
    @PrimaryColumn({ type: 'varchar' })
    id!: string;
    
    @Column({ type: 'varchar' })
    name!: string;
    
    @Column({ type: 'varchar' })
    email!: string;

    @Column({ type: 'varchar' })
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

}
