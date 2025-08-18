import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { UsersService } from "./users.service";
import { AccountType } from "@prisma/client";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { AccountTypesGuard } from "../common/guards/accountTypes.guard";
import { AccountTypes } from "../common/decorators/accountType.decorator";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
  ) { }

  @Post()
  @UseGuards(AccountTypesGuard)
  @AccountTypes(AccountType.SUPERADMIN)
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(AccountTypesGuard)
  @AccountTypes(AccountType.SUPERADMIN)
  findAll(@Query("limit") limit?: string, @Query("page") page?: string) {
    const pageNumber = parseInt(page ?? "1");
    const perPage = parseInt(limit ?? "10");

    return this.usersService.findAll(pageNumber, perPage);
  }

  @Get("search")
  @UseGuards(AccountTypesGuard)
  @AccountTypes(AccountType.SUPERADMIN)
  searchUser(
    @Query("q") query: string,
    @Query("limit") limit?: string,
    @Query("page") page?: string
  ) {
    const pageNumber = parseInt(page ?? "1");
    const perPage = parseInt(limit ?? "10");
    return this.usersService.searchUser(query, pageNumber, perPage);
  }

  @Patch("status/change/:id")
  changeStatus(@Param("id") id: string) {
    return this.usersService.changeStatus(id);
  }

  @Get("profile")
  getProfile(@Req() req) {
    const userId = req.user?.sub;
    return this.usersService.findOne(userId);
  }

  @Get(":id")
  @UseGuards(AccountTypesGuard)
  @AccountTypes(AccountType.SUPERADMIN)
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(":id")
  @UseGuards(AccountTypesGuard)
  @AccountTypes(AccountType.SUPERADMIN)
  updateProfile(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete("profile")
  @UseGuards(AccountTypesGuard)
  remove(@Req() req) {
    const userId = req.user?.sub;
    return this.usersService.remove(userId);
  }

  @Delete(":id")
  @UseGuards(AccountTypesGuard)
  @AccountTypes(AccountType.SUPERADMIN)
  removeUser(@Param("id") id: string) {
    return this.usersService.remove(id);
  }



}