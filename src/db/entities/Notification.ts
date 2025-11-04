import { Column, Entity, Index, ManyToOne, PrimaryColumn } from "typeorm"
import { User } from "./User";
import { UserNotificationType } from "@/helpers/types";

@Entity()
export class Notification {
    @PrimaryColumn({ type: 'varchar'})
    id!: string;

    @Index()
    @Column({ type: 'varchar' })
    userId!: string;

    @Column({ type: 'varchar' })
    type!: UserNotificationType;

    @Column({ type: 'varchar' })
    title!: string;

    @Column({ type: 'text' })
    description!: string;

    @Column({ type: 'boolean', default: false })
    isRead!: boolean;

    @Column({ type: 'varchar', nullable: true, default: null })
    uri!: string;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @ManyToOne(() => User)
    user!: User;
}
