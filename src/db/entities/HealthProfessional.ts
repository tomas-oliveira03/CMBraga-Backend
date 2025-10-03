import { Check, Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { MedicalReport } from "./MedicalReport"
import { HealthProfessionalSpecialty } from "@/helpers/types";

@Entity()
@Check(`"specialty" IN ('pediatrician', 'nutritionist', 'general_practitioner')`)
export class HealthProfessional {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'varchar' })
    name!: string;

    @Column({ type: 'varchar' })
    email!: string;

    @Column({ type: 'varchar', select: false })
    password!: string;

    @Column({ type: 'varchar' })
    specialty!: HealthProfessionalSpecialty;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    updatedAt!: Date | null;

    @OneToMany(() => MedicalReport, medicalReport => medicalReport.healthProfessional)
    medicalReports!: MedicalReport[];
}
