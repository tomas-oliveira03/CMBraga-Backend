import { Column, Entity, PrimaryColumn } from "typeorm"

@Entity()
export class Admin {
    @PrimaryColumn({ type: 'varchar' })
    id!: string;
    
    @Column({ type: 'varchar' })
    name!: string;
    
    @Column({ type: 'varchar' })
    email!: string;

    @Column({ type: 'varchar' })
    password!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    updatedAt!: Date | null;
}
