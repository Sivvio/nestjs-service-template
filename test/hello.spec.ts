import * as request from 'supertest';
import {testApp} from "./setup";

it('tests hello', async () => {
    await request(testApp.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
});
