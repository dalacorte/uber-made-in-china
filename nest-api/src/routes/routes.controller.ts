import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    Inject,
    OnModuleInit,
} from '@nestjs/common';
import { RoutesService } from './routes.service';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { ClientKafka } from '@nestjs/microservices/client';
import { Producer } from 'kafkajs';
import { MessagePattern, Payload } from '@nestjs/microservices';

@Controller('routes')
export class RoutesController implements OnModuleInit {
    private kafkaProducer: Producer;

    constructor(
        private readonly routesService: RoutesService,
        @Inject('KAFKA_SERVICE')
        private readonly kafkaClient: ClientKafka,
    ) {}

    async onModuleInit() {
        this.kafkaProducer = await this.kafkaClient.connect();
    }

    @Post()
    create(@Body() createRouteDto: CreateRouteDto) {
        return this.routesService.create(createRouteDto);
    }

    @Get()
    findAll() {
        return this.routesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.routesService.findOne(+id);
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() updateRouteDto: UpdateRouteDto) {
        return this.routesService.update(+id, updateRouteDto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.routesService.remove(+id);
    }

    @Get(':id/start')
    startRoute(@Param('id') id: string) {
        this.kafkaProducer.send({
            topic: 'routeNewDirection',
            messages: [
                {
                    key: 'routeNewDirection',
                    value: JSON.stringify({ routeId: id, clientId: '' }),
                },
            ],
        });
    }

    @MessagePattern('routeNewPosition')
    consumeNewPosition(
        @Payload()
        message: {
            value: {
                routeId: string;
                clientId: string;
                position: [number, number];
                finished: boolean;
            };
        },
    ) {
        console.log(message.value);
    }
}
