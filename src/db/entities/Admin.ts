import { Column, Entity, Index, PrimaryGeneratedColumn, OneToOne } from "typeorm"
import { User } from "./User";

@Entity()
export class Admin {
    @PrimaryGeneratedColumn("uuid")
    id!: string;
    
    @Column({ type: 'varchar' })
    name!: string;
    
    @Index()
    @Column({ type: 'varchar', unique: true })
    email!: string;
    
    @Column({ type: 'varchar', nullable: true, select: false })
    password!: string;

    @Column({ type: 'varchar' })
    profilePictureURL!: string;

    @Column({ type: 'varchar' })
    phone!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    activatedAt!: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    updatedAt!: Date | null;

    @OneToOne(() => User)
    user!: User;
}
