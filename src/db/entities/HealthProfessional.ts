import { Check, Column, Entity, Index, OneToMany, OneToOne, PrimaryColumn, PrimaryGeneratedColumn } from "typeorm"
import { MedicalReport } from "./MedicalReport"
import { HealthProfessionalSpecialty } from "@/helpers/types";
import { User } from "./User";

@Entity()
@Check(`"specialty" IN ('pediatrician', 'nutritionist', 'general_practitioner')`)
export class HealthProfessional {
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

    @Column({ type: 'varchar' })
    specialty!: HealthProfessionalSpecialty;

    @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
    createdAt!: Date;

    @Column({ type: 'timestamptz', nullable: true })
    activatedAt!: Date | null;

    @Column({ type: 'timestamptz', nullable: true })
    updatedAt!: Date | null;

    @OneToMany(() => MedicalReport, medicalReport => medicalReport.healthProfessional)
    medicalReports!: MedicalReport[];

    @OneToOne(() => User)
    user!: User;
}
