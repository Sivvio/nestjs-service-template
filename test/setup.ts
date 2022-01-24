import {Test, TestingModule} from "@nestjs/testing";
import {AppModule} from "../src/app.module";
import {INestApplication} from "@nestjs/common";
import {newDb} from 'pg-mem';
import {randomUUID} from "crypto";

export let testApp: INestApplication;
let db;
let dbBackup;

beforeAll(async () => {

    await initInMemoryDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();

    testApp = moduleFixture.createNestApplication();
    await testApp.init();
});

beforeEach(async () => {
    dbBackup.restore();
});

afterAll(async () => {
    await testApp.close();
});


const initInMemoryDatabase = async () => {
    db = newDb({
        autoCreateForeignKeyIndices: true,
    });

    // defines typeorm functions and intercepts postgres init queries
    db.public.registerFunction({
        implementation: () => 'test',
        name: 'current_database',
    });

    db.public.interceptQueries(queryText => {
        if (queryText.search(/(pg_views|pg_matviews|pg_tables|pg_enum|columns.*|ALTER TABLE)/g) > -1) {
            return [];
        }
        return null;
    });

    db.public.registerFunction({
        name: 'uuid_generate_v4',
        implementation: () => randomUUID()
    });

    const connection = await db.adapters.createTypeormConnection({
        type: "postgres",
        database: ":memory:",
        dropSchema: true,
        entities: [],
        synchronize: true,
        logging: false
    });

    await connection.synchronize();

    dbBackup = db.backup();
}
