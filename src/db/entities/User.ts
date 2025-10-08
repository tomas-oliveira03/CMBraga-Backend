import { Column, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Admin } from "./Admin";
import { Instructor } from "./Instructor";
import { Parent } from "./Parent";
import { HealthProfessional } from "./HealthProfessional";
import { UserChat } from "./UserChat";

@Entity()
export class User {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'varchar', unique: true })
    email!: string;

    @OneToOne(() => Admin, { nullable: true })
    admin!: Admin | null;

    @OneToOne(() => Instructor, { nullable: true })
    instructor!: Instructor | null;

    @OneToOne(() => Parent, { nullable: true })
    parent!: Parent | null;

    @OneToOne(() => HealthProfessional, { nullable: true })
    healthProfessional!: HealthProfessional | null;

    @OneToMany(() => UserChat, (userChat) => userChat.user)
    chats!: UserChat[];
}
