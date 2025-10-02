import { Column, Entity, ManyToOne, OneToMany, PrimaryColumn } from "typeorm"
import { Child } from "./Child";

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

    @OneToMany(() => Child, (child) => child.parent)
    child!: Child[];
}
