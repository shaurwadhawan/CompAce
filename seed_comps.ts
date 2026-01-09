import { prisma } from "./src/lib/db";
import { faker } from '@faker-js/faker';

async function main() {
    console.log('Seeding 200 competitions...');

    const tracks = ['Coding', 'Econ', 'MUN', 'Olympiad'];
    const modes = ['Online', 'In-person'];
    const regions = ['Local', 'International'];
    const levels = ['Beginner', 'High School', 'Open'];

    for (let i = 0; i < 200; i++) {
        const track = faker.helpers.arrayElement(tracks);
        const title = `${faker.word.adjective()} ${track} ${faker.word.noun()} ${faker.date.future().getFullYear()}`;

        await (prisma as any).competition.create({
            data: {
                title: title.charAt(0).toUpperCase() + title.slice(1),
                track,
                mode: faker.helpers.arrayElement(modes),
                region: faker.helpers.arrayElement(regions),
                level: faker.helpers.arrayElement(levels),
                deadline: faker.date.future().toISOString().split('T')[0],
                description: faker.lorem.paragraph(),
                format: faker.lorem.sentence(),
                eligibility: "High School Students",
                howToApply: "Apply on website",
                tags: JSON.stringify([faker.word.noun(), faker.word.noun()]),
                applyUrl: faker.internet.url(),
                officialUrl: faker.internet.url(),
                status: "APPROVED",
                source: "seed",
                createdAt: faker.date.past(),
            }
        });
    }

    console.log('Seeding complete.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
