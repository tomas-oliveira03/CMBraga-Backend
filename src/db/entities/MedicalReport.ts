import { Column, Entity, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { Child } from "./Child"
import { HealthProfessional } from "./HealthProfessional"

@Entity()
export class MedicalReport {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'varchar' })
    childId!: string;

    @Column({ type: 'varchar' })
    healthProfessionalId!: string;

    @Column({ type: 'text' })
    diagnosis!: string;

    @Column({ type: 'text', nullable: true })
    recommendations!: string | null;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    updatedAt!: Date | null;

    @ManyToOne(() => Child)
    child!: Child;

    @ManyToOne(() => HealthProfessional)
    healthProfessional!: HealthProfessional;
}
