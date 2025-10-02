import { Check, Column, Entity, OneToMany, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { MedicalReport } from "./MedicalReport"

export enum Specialty {
    PEDIATRICHIAN = 'pediatrician',
    NUTRITIONIST = 'nutritionist',
    GENERAL_PRACTITIONER = 'general_practitioner'
}

@Entity()
@Check(`"specialty" IN ('pediatrician', 'nutritionist', 'general_practitioner')`)
export class HealthProfessional {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ type: 'varchar' })
    name!: string;

    @Column({ type: 'varchar' })
    email!: string;

    @Column({ type: 'varchar' })
    password!: string;

    @Column({ type: 'varchar' })
    specialty!: Specialty;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    updatedAt!: Date | null;

    @OneToMany(() => MedicalReport, medicalReport => medicalReport.healthProfessional)
    medicalReports!: MedicalReport[];
}
