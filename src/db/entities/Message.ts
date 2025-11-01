import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne } from "typeorm";
import { User } from "./User";
import { Chat } from "./Chat";

@Entity()
export class Message {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'text' })
    content!: string;

    @Column({ type: 'timestamptz' })
    timestamp!: Date;

    @Column({ type: 'varchar' })
    chatId!: string;

    @Column({ type: 'varchar' })
    senderId!: string;
    
    @OneToOne(() => User, { nullable: false })
    sender!: User;

    @ManyToOne(() => Chat, chat => chat.messages, { nullable: false })
    chat!: Chat;
}
