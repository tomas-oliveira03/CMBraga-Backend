import { Entity, Column, PrimaryGeneratedColumn, OneToOne, ManyToOne, PrimaryColumn } from "typeorm";
import { User } from "./User";
import { Chat } from "./Chat";

@Entity()
export class UserChat {
    @PrimaryColumn({ type: 'varchar' })
    userId!: string;

    @PrimaryColumn({ type: 'varchar' })
    chatId!: string;

    @Column({ type: 'boolean', default: false })
    seen!: boolean;
    
    @ManyToOne(() => User)
    user!: User;

    @ManyToOne(() => Chat)
    chat!: Chat;
}
