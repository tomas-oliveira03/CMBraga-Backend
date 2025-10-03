import { Column, Entity, Index, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Admin {
    @PrimaryGeneratedColumn("uuid")
    id!: string;
    
    @Column({ type: 'varchar' })
    name!: string;
    
    @Index()
    @Column({ type: 'varchar', unique: true })
    email!: string;

    @Column({ type: 'varchar', select: false })
    password!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    updatedAt!: Date | null;
}
