import { Column, Entity, JoinColumn, OneToMany, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm";
import { Admin } from "./Admin";
import { Instructor } from "./Instructor";
import { Parent } from "./Parent";
import { HealthProfessional } from "./HealthProfessional";
import { UserChat } from "./UserChat";

@Entity()
export class User {
    @PrimaryColumn({ type: 'varchar'})
    id!: string;

    @Column({ type: 'varchar' })
    name!: string;

    @Column({ type: "varchar", nullable: true })
    adminId!: string | null;

    @Column({ type: "varchar", nullable: true })
    instructorId!: string | null;

    @Column({ type: "varchar", nullable: true })
    parentId!: string | null;

    @Column({ type: "varchar", nullable: true })
    healthProfessionalId!: string | null;

    @JoinColumn({ name: "admin_id" })
    @OneToOne(() => Admin, { nullable: true })
    admin!: Admin | null;

    @JoinColumn({ name: "instructor_id" })
    @OneToOne(() => Instructor, { nullable: true })
    instructor!: Instructor | null;

    @JoinColumn({ name: "parent_id" })
    @OneToOne(() => Parent, { nullable: true })
    parent!: Parent | null;

    @JoinColumn({ name: "health_professional_id" })
    @OneToOne(() => HealthProfessional, { nullable: true })
    healthProfessional!: HealthProfessional | null;

    @OneToMany(() => UserChat, (userChat) => userChat.user)
    chats!: UserChat[];
}
