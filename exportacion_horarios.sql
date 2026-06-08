--
-- PostgreSQL database dump
--

\restrict SWb31zCEkg4akE3rdacacOmYhwW96EBoH90wsoPsxLzjIkv2jlaHoADGxBma1Uw

-- Dumped from database version 18.4 (Debian 18.4-1.pgdg12+1)
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: asignacion_docente_curso; Type: TABLE; Schema: public; Owner: scheduling_unt_user
--

CREATE TABLE public.asignacion_docente_curso (
    id integer NOT NULL,
    docente_id integer NOT NULL,
    curso_id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    grupo character varying(10) DEFAULT 'Ãšnico'::character varying,
    horas_asignadas integer DEFAULT 0,
    ambiente_preferido_id integer,
    semestre_asignacion character varying(20) DEFAULT '2026-1'::character varying,
    ciclo integer,
    observaciones text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT asignacion_docente_curso_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['Teoria'::character varying, 'Practica'::character varying, 'Laboratorio'::character varying])::text[])))
);


ALTER TABLE public.asignacion_docente_curso OWNER TO scheduling_unt_user;

--
-- Name: TABLE asignacion_docente_curso; Type: COMMENT; Schema: public; Owner: scheduling_unt_user
--

COMMENT ON TABLE public.asignacion_docente_curso IS 'Relaciona docentes con cursos que dictan separados por grupos y horas congeladas';


--
-- Name: asignacion_docente_curso_id_seq; Type: SEQUENCE; Schema: public; Owner: scheduling_unt_user
--

CREATE SEQUENCE public.asignacion_docente_curso_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.asignacion_docente_curso_id_seq OWNER TO scheduling_unt_user;

--
-- Name: asignacion_docente_curso_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: scheduling_unt_user
--

ALTER SEQUENCE public.asignacion_docente_curso_id_seq OWNED BY public.asignacion_docente_curso.id;


--
-- Name: horarios; Type: TABLE; Schema: public; Owner: scheduling_unt_user
--

CREATE TABLE public.horarios (
    id integer NOT NULL,
    asignacion_id integer NOT NULL,
    semestre character varying(20) DEFAULT '2026-1'::character varying NOT NULL,
    dia character varying(20) NOT NULL,
    hora_inicio time without time zone NOT NULL,
    hora_fin time without time zone NOT NULL,
    aula_id integer,
    laboratorio_id integer,
    generado_automaticamente boolean DEFAULT true NOT NULL,
    editado_manualmente boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_horario_rango CHECK ((hora_inicio < hora_fin)),
    CONSTRAINT horarios_dia_check CHECK (((dia)::text = ANY ((ARRAY['Lunes'::character varying, 'Martes'::character varying, 'Miercoles'::character varying, 'Jueves'::character varying, 'Viernes'::character varying, 'Sabado'::character varying, 'Domingo'::character varying])::text[])))
);


ALTER TABLE public.horarios OWNER TO scheduling_unt_user;

--
-- Name: TABLE horarios; Type: COMMENT; Schema: public; Owner: scheduling_unt_user
--

COMMENT ON TABLE public.horarios IS 'Horarios finales asignados tras ejecutar el algoritmo o edicion manual';


--
-- Name: horarios_id_seq; Type: SEQUENCE; Schema: public; Owner: scheduling_unt_user
--

CREATE SEQUENCE public.horarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.horarios_id_seq OWNER TO scheduling_unt_user;

--
-- Name: horarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: scheduling_unt_user
--

ALTER SEQUENCE public.horarios_id_seq OWNED BY public.horarios.id;


--
-- Name: asignacion_docente_curso id; Type: DEFAULT; Schema: public; Owner: scheduling_unt_user
--

ALTER TABLE ONLY public.asignacion_docente_curso ALTER COLUMN id SET DEFAULT nextval('public.asignacion_docente_curso_id_seq'::regclass);


--
-- Name: horarios id; Type: DEFAULT; Schema: public; Owner: scheduling_unt_user
--

ALTER TABLE ONLY public.horarios ALTER COLUMN id SET DEFAULT nextval('public.horarios_id_seq'::regclass);


--
-- Data for Name: asignacion_docente_curso; Type: TABLE DATA; Schema: public; Owner: scheduling_unt_user
--

COPY public.asignacion_docente_curso (id, docente_id, curso_id, tipo, grupo, horas_asignadas, ambiente_preferido_id, semestre_asignacion, ciclo, observaciones, created_at) FROM stdin;
2155	50	57	Teoria	Único	2	\N	2026-1	7	\N	2026-06-08 00:01:04.812701
2156	50	57	Practica	Único	1	\N	2026-1	7	\N	2026-06-08 00:01:05.124957
2161	40	56	Laboratorio	A	3	\N	2026-1	7	\N	2026-06-08 00:02:54.18447
2166	49	55	Laboratorio	C	2	\N	2026-1	7	\N	2026-06-08 00:03:52.162615
2173	43	53	Teoria	Único	1	\N	2026-1	7	\N	2026-06-08 00:05:15.570732
2174	43	53	Practica	Único	2	\N	2026-1	7	\N	2026-06-08 00:05:15.741099
2179	46	58	Practica	Único	1	\N	2026-1	7	\N	2026-06-08 00:06:42.767381
2185	22	52	Practica	Único	2	\N	2026-1	7	\N	2026-06-08 00:13:05.064933
2191	43	69	Laboratorio	A	2	\N	2026-1	9	\N	2026-06-08 01:36:26.019009
2200	54	72	Laboratorio	B	3	\N	2026-1	9	\N	2026-06-08 01:38:41.063094
2206	41	73	Laboratorio	B	3	\N	2026-1	9	\N	2026-06-08 01:39:04.471689
2211	46	70	Laboratorio	B	2	\N	2026-1	9	\N	2026-06-08 01:39:40.894154
2216	49	74	Teoria	Único	2	\N	2026-1	9	\N	2026-06-08 01:40:07.313586
2157	50	57	Laboratorio	A	3	\N	2026-1	7	\N	2026-06-08 00:01:05.183397
2162	40	56	Teoria	Único	1	\N	2026-1	7	\N	2026-06-08 00:02:54.277121
2167	49	55	Practica	Único	2	\N	2026-1	7	\N	2026-06-08 00:03:52.169205
2170	49	55	Laboratorio	A	2	\N	2026-1	7	\N	2026-06-08 00:03:52.265894
2175	48	54	Teoria	Único	2	\N	2026-1	7	\N	2026-06-08 00:05:43.476991
2180	46	58	Laboratorio	B	3	\N	2026-1	7	\N	2026-06-08 00:06:42.773331
2186	54	68	Laboratorio	C	2	\N	2026-1	9	\N	2026-06-08 01:33:29.994486
2187	54	68	Laboratorio	B	2	\N	2026-1	9	\N	2026-06-08 01:33:30.276954
2192	43	69	Practica	Único	2	\N	2026-1	9	\N	2026-06-08 01:36:26.068289
2193	43	69	Laboratorio	B	2	\N	2026-1	9	\N	2026-06-08 01:36:26.314942
2194	43	69	Teoria	Único	1	\N	2026-1	9	\N	2026-06-08 01:36:26.337119
2201	54	72	Laboratorio	A	3	\N	2026-1	9	\N	2026-06-08 01:38:41.071201
2202	54	72	Teoria	Único	1	\N	2026-1	9	\N	2026-06-08 01:38:41.286451
2207	41	73	Practica	Único	1	\N	2026-1	9	\N	2026-06-08 01:39:04.562911
2212	46	70	Practica	B	2	\N	2026-1	9	\N	2026-06-08 01:39:40.978693
2217	76	75	Laboratorio	B	2	\N	2026-1	9	\N	2026-06-08 01:40:35.286284
1357	21	50	Practica	Único	2	\N	2026-2	6	\N	2026-06-05 13:57:17.073149
1358	16	51	Teoria	Único	2	\N	2026-2	6	\N	2026-06-05 13:57:17.092704
1359	16	51	Practica	Único	2	\N	2026-2	6	\N	2026-06-05 13:57:17.095708
1360	15	44	Teoria	Único	1	\N	2026-2	6	\N	2026-06-05 13:57:17.098331
1361	15	44	Practica	Único	2	\N	2026-2	6	\N	2026-06-05 13:57:17.10113
1362	15	44	Laboratorio	Único	2	\N	2026-2	6	\N	2026-06-05 13:57:17.105473
1363	22	46	Teoria	Único	1	\N	2026-2	6	\N	2026-06-05 13:57:17.109247
1364	22	46	Practica	Único	2	\N	2026-2	6	\N	2026-06-05 13:57:17.111589
1365	22	46	Laboratorio	Único	2	\N	2026-2	6	\N	2026-06-05 13:57:17.115688
1366	45	61	Teoria	Único	1	\N	2026-2	8	\N	2026-06-05 13:57:17.118302
1367	45	61	Practica	Único	2	\N	2026-2	8	\N	2026-06-05 13:57:17.121817
2158	45	57	Laboratorio	C	3	\N	2026-1	7	\N	2026-06-08 00:01:31.869148
2154	50	78	Practica	Único	2	\N	2026-2	10	\N	2026-06-06 03:14:46.63908
2163	40	56	Laboratorio	C	3	\N	2026-1	7	\N	2026-06-08 00:02:54.278246
2168	49	55	Laboratorio	B	2	\N	2026-1	7	\N	2026-06-08 00:03:52.181158
2169	49	55	Teoria	Único	1	\N	2026-1	7	\N	2026-06-08 00:03:52.264784
2176	48	54	Practica	Único	2	\N	2026-1	7	\N	2026-06-08 00:05:43.483373
2182	48	59	Laboratorio	A	2	1	2026-1	7	\N	2026-06-08 00:08:33.221696
2181	48	59	Laboratorio	B	2	2	2026-1	7	\N	2026-06-08 00:08:32.857487
2188	54	68	Laboratorio	A	2	\N	2026-1	9	\N	2026-06-08 01:33:30.487785
2195	46	71	Laboratorio	Único	2	\N	2026-1	9	\N	2026-06-08 01:37:19.664916
2196	46	71	Practica	Único	2	\N	2026-1	9	\N	2026-06-08 01:37:20.103905
2203	41	73	Laboratorio	A	3	\N	2026-1	9	\N	2026-06-08 01:39:04.265121
2208	50	70	Teoria	A	2	\N	2026-1	9	\N	2026-06-08 01:39:27.467949
2213	46	70	Teoria	B	2	\N	2026-1	9	\N	2026-06-08 01:39:40.982695
2218	76	75	Teoria	Único	2	\N	2026-1	9	\N	2026-06-08 01:40:35.364777
2159	45	57	Laboratorio	B	3	\N	2026-1	7	\N	2026-06-08 00:01:31.869951
2164	40	56	Laboratorio	B	3	\N	2026-1	7	\N	2026-06-08 00:02:54.370936
2171	43	53	Laboratorio	B	2	\N	2026-1	7	\N	2026-06-08 00:05:15.568277
2177	46	58	Teoria	Único	1	\N	2026-1	7	\N	2026-06-08 00:06:42.566854
2183	51	59	Teoria	Único	2	\N	2026-1	7	\N	2026-06-08 00:12:28.428705
2189	54	68	Teoria	Único	1	\N	2026-1	9	\N	2026-06-08 01:33:30.564723
2197	46	71	Teoria	Único	1	\N	2026-1	9	\N	2026-06-08 01:37:20.366358
2204	41	73	Teoria	Único	1	\N	2026-1	9	\N	2026-06-08 01:39:04.467545
2209	50	70	Laboratorio	A	2	\N	2026-1	9	\N	2026-06-08 01:39:27.580391
2214	49	74	Laboratorio	B	2	\N	2026-1	9	\N	2026-06-08 01:40:07.214303
2219	76	75	Laboratorio	A	2	\N	2026-1	9	\N	2026-06-08 01:40:35.383704
1295	50	16	Teoria	Único	2	\N	2026-2	2	\N	2026-06-05 13:57:16.841696
1296	50	16	Laboratorio	A	3	\N	2026-2	2	\N	2026-06-05 13:57:16.850707
1297	50	16	Laboratorio	B	3	\N	2026-2	2	\N	2026-06-05 13:57:16.855908
1298	50	16	Laboratorio	C	3	\N	2026-2	2	\N	2026-06-05 13:57:16.865698
1299	50	16	Laboratorio	D	3	\N	2026-2	2	\N	2026-06-05 13:57:16.868332
1300	12	11	Teoria	Único	2	\N	2026-2	2	\N	2026-06-05 13:57:16.870827
1301	12	11	Practica	Único	2	\N	2026-2	2	\N	2026-06-05 13:57:16.87543
1302	13	12	Teoria	Único	1	\N	2026-2	2	\N	2026-06-05 13:57:16.878845
1303	13	12	Practica	Único	4	\N	2026-2	2	\N	2026-06-05 13:57:16.883876
1304	14	13	Teoria	Único	2	\N	2026-2	2	\N	2026-06-05 13:57:16.887799
1305	14	13	Practica	Único	2	\N	2026-2	2	\N	2026-06-05 13:57:16.890114
1306	1	14	Teoria	Único	2	\N	2026-2	2	\N	2026-06-05 13:57:16.892351
1307	1	14	Practica	Único	4	\N	2026-2	2	\N	2026-06-05 13:57:16.897271
1308	7	15	Teoria	Único	2	\N	2026-2	2	\N	2026-06-05 13:57:16.901734
1309	7	15	Practica	Único	6	\N	2026-2	2	\N	2026-06-05 13:57:16.904065
1310	7	15	Laboratorio	A	2	\N	2026-2	2	\N	2026-06-05 13:57:16.906353
1311	7	15	Laboratorio	B	2	\N	2026-2	2	\N	2026-06-05 13:57:16.910701
1312	7	15	Laboratorio	C	2	\N	2026-2	2	\N	2026-06-05 13:57:16.913815
1313	7	15	Laboratorio	D	2	\N	2026-2	2	\N	2026-06-05 13:57:16.916155
1314	44	17	Practica	Único	2	\N	2026-2	2	\N	2026-06-05 13:57:16.920701
1315	18	18	Practica	Único	2	\N	2026-2	2	\N	2026-06-05 13:57:16.92295
1316	19	19	Practica	Único	2	\N	2026-2	2	\N	2026-06-05 13:57:16.925432
1317	41	29	Teoria	Único	1	\N	2026-2	4	\N	2026-06-05 13:57:16.928696
1318	41	29	Practica	Único	1	\N	2026-2	4	\N	2026-06-05 13:57:16.931825
1319	41	29	Laboratorio	A	2	\N	2026-2	4	\N	2026-06-05 13:57:16.936698
1320	41	29	Laboratorio	B	2	\N	2026-2	4	\N	2026-06-05 13:57:16.939152
1321	41	29	Laboratorio	C	2	\N	2026-2	4	\N	2026-06-05 13:57:16.942697
1322	53	32	Teoria	Único	1	\N	2026-2	4	\N	2026-06-05 13:57:16.945163
1323	53	32	Practica	Único	2	\N	2026-2	4	\N	2026-06-05 13:57:16.949176
1324	53	32	Laboratorio	A	2	\N	2026-2	4	\N	2026-06-05 13:57:16.952864
1325	53	32	Laboratorio	B	2	\N	2026-2	4	\N	2026-06-05 13:57:16.955147
1326	53	32	Laboratorio	C	2	\N	2026-2	4	\N	2026-06-05 13:57:16.957249
1327	54	33	Teoria	Único	2	\N	2026-2	4	\N	2026-06-05 13:57:16.961696
1328	54	33	Practica	Único	1	\N	2026-2	4	\N	2026-06-05 13:57:16.964235
1329	54	33	Laboratorio	A	2	\N	2026-2	4	\N	2026-06-05 13:57:16.967827
1330	54	33	Laboratorio	B	2	\N	2026-2	4	\N	2026-06-05 13:57:16.970049
1331	54	33	Laboratorio	C	2	\N	2026-2	4	\N	2026-06-05 13:57:16.973825
1332	40	34	Teoria	Único	1	\N	2026-2	4	\N	2026-06-05 13:57:16.979956
1333	40	34	Practica	Único	1	\N	2026-2	4	\N	2026-06-05 13:57:16.982338
1334	40	34	Laboratorio	Único	3	\N	2026-2	4	\N	2026-06-05 13:57:16.984627
1335	52	35	Teoria	Único	2	\N	2026-2	4	\N	2026-06-05 13:57:16.989999
1336	52	35	Laboratorio	A	2	\N	2026-2	4	\N	2026-06-05 13:57:16.992498
1337	52	35	Laboratorio	B	2	\N	2026-2	4	\N	2026-06-05 13:57:16.996951
1338	43	45	Teoria	Único	1	\N	2026-2	6	\N	2026-06-05 13:57:17.002147
1339	43	45	Practica	Único	2	\N	2026-2	6	\N	2026-06-05 13:57:17.006198
1340	43	45	Laboratorio	A	2	\N	2026-2	6	\N	2026-06-05 13:57:17.008885
1341	43	45	Laboratorio	B	2	\N	2026-2	6	\N	2026-06-05 13:57:17.014697
1342	51	47	Teoria	Único	2	\N	2026-2	6	\N	2026-06-05 13:57:17.022369
1343	51	47	Practica	Único	1	\N	2026-2	6	\N	2026-06-05 13:57:17.024774
1344	51	47	Laboratorio	A	3	\N	2026-2	6	\N	2026-06-05 13:57:17.027063
1345	51	47	Laboratorio	B	3	\N	2026-2	6	\N	2026-06-05 13:57:17.032824
1346	51	47	Laboratorio	C	3	\N	2026-2	6	\N	2026-06-05 13:57:17.035065
1347	46	48	Teoria	Único	1	\N	2026-2	6	\N	2026-06-05 13:57:17.03885
1348	46	48	Practica	Único	2	\N	2026-2	6	\N	2026-06-05 13:57:17.041225
1349	46	48	Laboratorio	A	2	\N	2026-2	6	\N	2026-06-05 13:57:17.044813
1350	46	48	Laboratorio	B	2	\N	2026-2	6	\N	2026-06-05 13:57:17.046881
1351	46	48	Laboratorio	C	2	\N	2026-2	6	\N	2026-06-05 13:57:17.05096
1352	76	49	Teoria	Único	1	\N	2026-2	6	\N	2026-06-05 13:57:17.054886
1353	76	49	Practica	Único	2	\N	2026-2	6	\N	2026-06-05 13:57:17.057707
1354	76	49	Laboratorio	A	2	\N	2026-2	6	\N	2026-06-05 13:57:17.061887
1355	76	49	Laboratorio	B	2	\N	2026-2	6	\N	2026-06-05 13:57:17.064309
1356	21	50	Teoria	Único	2	\N	2026-2	6	\N	2026-06-05 13:57:17.068028
1368	45	61	Laboratorio	A	2	\N	2026-2	8	\N	2026-06-05 13:57:17.124873
1369	45	61	Laboratorio	B	2	\N	2026-2	8	\N	2026-06-05 13:57:17.129698
1370	45	61	Laboratorio	C	2	\N	2026-2	8	\N	2026-06-05 13:57:17.132943
1371	49	62	Teoria	Único	1	\N	2026-2	8	\N	2026-06-05 13:57:17.13647
1372	49	62	Practica	Único	1	\N	2026-2	8	\N	2026-06-05 13:57:17.139855
1373	49	62	Laboratorio	A	2	\N	2026-2	8	\N	2026-06-05 13:57:17.142989
1374	49	62	Laboratorio	B	2	\N	2026-2	8	\N	2026-06-05 13:57:17.145411
1375	49	62	Laboratorio	C	2	\N	2026-2	8	\N	2026-06-05 13:57:17.149696
1376	47	63	Teoria	Único	1	\N	2026-2	8	\N	2026-06-05 13:57:17.154702
1377	47	63	Practica	Único	2	\N	2026-2	8	\N	2026-06-05 13:57:17.157861
1378	47	63	Laboratorio	A	2	\N	2026-2	8	\N	2026-06-05 13:57:17.160701
1379	47	63	Laboratorio	B	2	\N	2026-2	8	\N	2026-06-05 13:57:17.163822
1380	47	63	Laboratorio	C	2	\N	2026-2	8	\N	2026-06-05 13:57:17.1677
1381	48	64	Teoria	Único	1	\N	2026-2	8	\N	2026-06-05 13:57:17.171483
1382	48	64	Practica	Único	1	\N	2026-2	8	\N	2026-06-05 13:57:17.175002
1383	48	64	Laboratorio	A	2	\N	2026-2	8	\N	2026-06-05 13:57:17.177912
1384	48	64	Laboratorio	B	2	\N	2026-2	8	\N	2026-06-05 13:57:17.180771
1385	48	64	Laboratorio	C	2	\N	2026-2	8	\N	2026-06-05 13:57:17.18385
1386	44	65	Teoria	Único	2	\N	2026-2	8	\N	2026-06-05 13:57:17.187833
1387	44	65	Practica	Único	1	\N	2026-2	8	\N	2026-06-05 13:57:17.1947
1388	44	65	Laboratorio	A	2	\N	2026-2	8	\N	2026-06-05 13:57:17.198527
1389	44	65	Laboratorio	B	2	\N	2026-2	8	\N	2026-06-05 13:57:17.202854
1390	44	65	Laboratorio	C	2	\N	2026-2	8	\N	2026-06-05 13:57:17.206718
1391	20	66	Teoria	Único	2	\N	2026-2	8	\N	2026-06-05 13:57:17.209006
1392	20	66	Practica	Único	2	\N	2026-2	8	\N	2026-06-05 13:57:17.211292
1393	40	67	Teoria	Único	2	\N	2026-2	8	\N	2026-06-05 13:57:17.215699
1394	40	67	Laboratorio	Único	2	\N	2026-2	8	\N	2026-06-05 13:57:17.220703
1395	52	60	Teoria	Único	1	\N	2026-2	8	\N	2026-06-05 13:57:17.22316
1396	52	60	Practica	Único	2	\N	2026-2	8	\N	2026-06-05 13:57:17.225394
1397	52	60	Laboratorio	A	2	\N	2026-2	8	\N	2026-06-05 13:57:17.229244
1398	52	60	Laboratorio	B	2	\N	2026-2	8	\N	2026-06-05 13:57:17.233696
1399	43	76	Teoria	Único	2	\N	2026-2	10	\N	2026-06-05 13:57:17.235978
1400	43	76	Practica	Único	1	\N	2026-2	10	\N	2026-06-05 13:57:17.238904
1401	43	76	Laboratorio	A	2	\N	2026-2	10	\N	2026-06-05 13:57:17.241409
1402	43	76	Laboratorio	B	2	\N	2026-2	10	\N	2026-06-05 13:57:17.248821
1403	43	76	Laboratorio	C	2	\N	2026-2	10	\N	2026-06-05 13:57:17.257645
1404	76	77	Teoria	Único	1	\N	2026-2	10	\N	2026-06-05 13:57:17.262407
1405	76	77	Practica	Único	2	\N	2026-2	10	\N	2026-06-05 13:57:17.267508
1406	76	77	Laboratorio	A	2	\N	2026-2	10	\N	2026-06-05 13:57:17.272096
1407	76	77	Laboratorio	B	2	\N	2026-2	10	\N	2026-06-05 13:57:17.276702
1408	41	79	Teoria	Único	1	\N	2026-2	10	\N	2026-06-05 13:57:17.280699
1409	41	79	Practica	Único	2	\N	2026-2	10	\N	2026-06-05 13:57:17.284625
1410	41	79	Laboratorio	A	2	\N	2026-2	10	\N	2026-06-05 13:57:17.2877
1411	41	79	Laboratorio	B	2	\N	2026-2	10	\N	2026-06-05 13:57:17.292742
1412	41	79	Laboratorio	C	2	\N	2026-2	10	\N	2026-06-05 13:57:17.296755
1413	49	81	Teoria	Único	1	\N	2026-2	10	\N	2026-06-05 13:57:17.299205
1414	49	81	Practica	Único	1	\N	2026-2	10	\N	2026-06-05 13:57:17.305297
1415	49	81	Laboratorio	A	2	\N	2026-2	10	\N	2026-06-05 13:57:17.309958
1416	49	81	Laboratorio	B	2	\N	2026-2	10	\N	2026-06-05 13:57:17.315155
1417	49	81	Laboratorio	C	2	\N	2026-2	10	\N	2026-06-05 13:57:17.3197
1418	48	82	Teoria	Único	2	\N	2026-2	10	\N	2026-06-05 13:57:17.323337
1419	48	82	Practica	Único	1	\N	2026-2	10	\N	2026-06-05 13:57:17.327216
1420	48	82	Laboratorio	A	2	\N	2026-2	10	\N	2026-06-05 13:57:17.331454
1421	48	82	Laboratorio	B	2	\N	2026-2	10	\N	2026-06-05 13:57:17.337797
1422	48	82	Laboratorio	C	2	\N	2026-2	10	\N	2026-06-05 13:57:17.343051
1423	53	78	Teoria	Único	2	\N	2026-2	10	\N	2026-06-05 13:57:17.34547
2160	40	56	Practica	Único	1	\N	2026-1	7	\N	2026-06-08 00:02:54.167404
1425	53	78	Laboratorio	A	2	\N	2026-2	10	\N	2026-06-05 13:57:17.356725
1426	53	78	Laboratorio	B	2	\N	2026-2	10	\N	2026-06-05 13:57:17.359931
1427	22	80	Teoria	Único	2	\N	2026-2	10	\N	2026-06-05 13:57:17.364884
1428	22	80	Practica	Único	2	\N	2026-2	10	\N	2026-06-05 13:57:17.368074
2165	49	55	Laboratorio	D	2	\N	2026-1	7	\N	2026-06-08 00:03:52.064782
2172	43	53	Laboratorio	A	2	\N	2026-1	7	\N	2026-06-08 00:05:15.570411
2178	46	58	Laboratorio	A	3	\N	2026-1	7	\N	2026-06-08 00:06:42.667692
2184	22	52	Teoria	Único	2	\N	2026-1	7	\N	2026-06-08 00:13:04.973069
2198	54	72	Laboratorio	C	3	\N	2026-1	9	\N	2026-06-08 01:38:40.55844
2199	54	72	Practica	Único	1	\N	2026-1	9	\N	2026-06-08 01:38:40.912561
2205	41	73	Laboratorio	C	3	\N	2026-1	9	\N	2026-06-08 01:39:04.469467
2210	50	70	Practica	A	2	\N	2026-1	9	\N	2026-06-08 01:39:27.675921
2215	49	74	Laboratorio	A	2	\N	2026-1	9	\N	2026-06-08 01:40:07.311701
2220	54	68	Practica	Único	2	\N	2026-1	9	\N	2026-06-08 01:47:38.289193
\.


--
-- Data for Name: horarios; Type: TABLE DATA; Schema: public; Owner: scheduling_unt_user
--

COPY public.horarios (id, asignacion_id, semestre, dia, hora_inicio, hora_fin, aula_id, laboratorio_id, generado_automaticamente, editado_manualmente, created_at, updated_at) FROM stdin;
2445	2155	2026-1	Martes	10:00:00	12:00:00	7	\N	f	t	2026-06-08 00:41:20.366439	2026-06-08 00:41:20.366439
2446	2156	2026-1	Martes	12:00:00	13:00:00	7	\N	f	t	2026-06-08 00:41:20.698306	2026-06-08 00:41:20.698306
2447	2157	2026-1	Martes	07:00:00	10:00:00	\N	5	f	t	2026-06-08 00:41:43.124992	2026-06-08 00:41:43.124992
2448	2162	2026-1	Viernes	16:00:00	17:00:00	8	\N	f	t	2026-06-08 00:42:31.119321	2026-06-08 00:42:31.119321
2449	2160	2026-1	Viernes	17:00:00	18:00:00	8	\N	f	t	2026-06-08 00:42:31.404558	2026-06-08 00:42:31.404558
2450	2161	2026-1	Lunes	13:00:00	16:00:00	\N	6	f	t	2026-06-08 00:43:30.796342	2026-06-08 00:43:30.796342
2451	2164	2026-1	Lunes	16:00:00	19:00:00	\N	6	f	t	2026-06-08 00:43:43.105651	2026-06-08 00:43:43.105651
2452	2163	2026-1	Lunes	10:00:00	13:00:00	\N	7	f	t	2026-06-08 00:44:16.206695	2026-06-08 00:44:16.206695
2453	2183	2026-1	Martes	16:00:00	18:00:00	8	\N	f	t	2026-06-08 00:44:41.82249	2026-06-08 00:44:41.82249
2454	2173	2026-1	Viernes	07:00:00	08:00:00	7	\N	f	t	2026-06-08 00:45:02.582878	2026-06-08 00:45:02.582878
2455	2174	2026-1	Viernes	08:00:00	10:00:00	7	\N	f	t	2026-06-08 00:45:02.952125	2026-06-08 00:45:02.952125
2456	2172	2026-1	Viernes	10:00:00	12:00:00	\N	5	f	t	2026-06-08 00:45:16.816773	2026-06-08 00:45:16.816773
2457	2171	2026-1	Viernes	12:00:00	14:00:00	\N	5	f	t	2026-06-08 00:45:27.505576	2026-06-08 00:45:27.505576
2458	2177	2026-1	Jueves	07:00:00	08:00:00	9	\N	f	t	2026-06-08 00:46:02.07511	2026-06-08 00:46:02.07511
2459	2179	2026-1	Jueves	08:00:00	09:00:00	9	\N	f	t	2026-06-08 00:46:02.387896	2026-06-08 00:46:02.387896
2460	2178	2026-1	Jueves	18:00:00	21:00:00	\N	8	f	t	2026-06-08 00:46:32.874117	2026-06-08 00:46:32.874117
2461	2180	2026-1	Viernes	18:00:00	21:00:00	\N	6	f	t	2026-06-08 00:47:05.894418	2026-06-08 00:47:05.894418
2462	2159	2026-1	Lunes	07:00:00	10:00:00	\N	5	f	t	2026-06-08 00:47:31.03954	2026-06-08 00:47:31.03954
2463	2158	2026-1	Lunes	10:00:00	13:00:00	\N	5	f	t	2026-06-08 00:47:59.467821	2026-06-08 00:47:59.467821
2464	2169	2026-1	Martes	13:00:00	14:00:00	9	\N	f	t	2026-06-08 00:48:28.096698	2026-06-08 00:48:28.096698
2465	2167	2026-1	Martes	14:00:00	16:00:00	9	\N	f	t	2026-06-08 00:48:28.407058	2026-06-08 00:48:28.407058
2466	2170	2026-1	Miercoles	13:00:00	15:00:00	\N	8	f	t	2026-06-08 00:48:43.187336	2026-06-08 00:48:43.187336
2467	2168	2026-1	Miercoles	15:00:00	17:00:00	\N	8	f	t	2026-06-08 00:48:53.935992	2026-06-08 00:48:53.935992
2468	2166	2026-1	Miercoles	17:00:00	19:00:00	\N	10	f	t	2026-06-08 00:52:01.769255	2026-06-08 00:52:01.769255
2470	2175	2026-1	Jueves	14:00:00	16:00:00	9	\N	f	t	2026-06-08 00:53:27.315158	2026-06-08 00:53:27.315158
2471	2176	2026-1	Jueves	16:00:00	18:00:00	9	\N	f	t	2026-06-08 00:53:27.558321	2026-06-08 00:53:27.558321
2472	2182	2026-1	Lunes	14:00:00	16:00:00	\N	8	f	t	2026-06-08 00:53:47.061462	2026-06-08 00:53:47.061462
2473	2181	2026-1	Lunes	16:00:00	18:00:00	\N	8	f	t	2026-06-08 00:53:56.31453	2026-06-08 00:53:56.31453
2474	2184	2026-1	Miercoles	07:00:00	09:00:00	10	\N	f	t	2026-06-08 00:54:31.079583	2026-06-08 00:54:31.079583
2475	2185	2026-1	Miercoles	09:00:00	11:00:00	10	\N	f	t	2026-06-08 00:54:31.393095	2026-06-08 00:54:31.393095
2469	2165	2026-1	Jueves	09:00:00	11:00:00	\N	7	f	t	2026-06-08 00:52:49.586775	2026-06-08 01:00:13.277086
2478	2208	2026-1	Jueves	07:00:00	09:00:00	7	\N	f	t	2026-06-08 01:43:08.179288	2026-06-08 01:43:08.179288
2479	2210	2026-1	Jueves	09:00:00	11:00:00	7	\N	f	t	2026-06-08 01:43:08.409688	2026-06-08 01:43:08.409688
2480	2209	2026-1	Jueves	11:00:00	13:00:00	\N	6	f	t	2026-06-08 01:43:18.870078	2026-06-08 01:43:18.870078
2481	2204	2026-1	Lunes	18:00:00	19:00:00	7	\N	f	t	2026-06-08 01:43:58.140993	2026-06-08 01:43:58.140993
2482	2207	2026-1	Lunes	19:00:00	20:00:00	7	\N	f	t	2026-06-08 01:43:58.370156	2026-06-08 01:43:58.370156
2483	2203	2026-1	Martes	14:00:00	17:00:00	\N	8	f	t	2026-06-08 01:44:31.027718	2026-06-08 01:44:31.027718
2484	2206	2026-1	Martes	17:00:00	20:00:00	\N	8	f	t	2026-06-08 01:44:49.69278	2026-06-08 01:44:49.69278
2485	2205	2026-1	Miercoles	10:00:00	13:00:00	\N	8	f	t	2026-06-08 01:45:11.616141	2026-06-08 01:45:11.616141
2486	2189	2026-1	Lunes	14:00:00	15:00:00	7	\N	f	t	2026-06-08 01:48:18.351511	2026-06-08 01:48:18.351511
2487	2220	2026-1	Lunes	15:00:00	17:00:00	7	\N	f	t	2026-06-08 01:48:18.591246	2026-06-08 01:48:18.591246
2488	2188	2026-1	Martes	10:00:00	12:00:00	\N	10	f	t	2026-06-08 01:48:48.10593	2026-06-08 01:48:48.10593
2489	2187	2026-1	Martes	13:00:00	15:00:00	\N	5	f	t	2026-06-08 01:49:08.710137	2026-06-08 01:49:08.710137
2490	2186	2026-1	Martes	19:00:00	21:00:00	\N	5	f	t	2026-06-08 01:49:26.990496	2026-06-08 01:49:26.990496
2491	2202	2026-1	Jueves	18:00:00	19:00:00	7	\N	f	t	2026-06-08 01:50:11.441024	2026-06-08 01:50:11.441024
2492	2199	2026-1	Jueves	19:00:00	20:00:00	7	\N	f	t	2026-06-08 01:50:11.744473	2026-06-08 01:50:11.744473
2493	2201	2026-1	Lunes	07:00:00	10:00:00	\N	7	f	t	2026-06-08 01:51:01.291296	2026-06-08 01:51:01.291296
2494	2200	2026-1	Miercoles	07:00:00	10:00:00	\N	7	f	t	2026-06-08 01:51:12.581729	2026-06-08 01:51:12.581729
2495	2198	2026-1	Miercoles	17:00:00	20:00:00	\N	8	f	t	2026-06-08 01:51:27.826434	2026-06-08 01:51:27.826434
2496	2194	2026-1	Lunes	10:00:00	11:00:00	7	\N	f	t	2026-06-08 01:51:46.738365	2026-06-08 01:51:46.738365
2497	2192	2026-1	Lunes	11:00:00	13:00:00	7	\N	f	t	2026-06-08 01:51:47.059478	2026-06-08 01:51:47.059478
2498	2191	2026-1	Martes	10:00:00	12:00:00	\N	7	f	t	2026-06-08 01:52:09.83115	2026-06-08 01:52:09.83115
2499	2193	2026-1	Martes	12:00:00	14:00:00	\N	7	f	t	2026-06-08 01:52:46.166711	2026-06-08 01:52:46.166711
2500	2197	2026-1	Viernes	10:00:00	11:00:00	7	\N	f	t	2026-06-08 01:53:24.327709	2026-06-08 01:53:24.327709
2501	2196	2026-1	Viernes	11:00:00	13:00:00	7	\N	f	t	2026-06-08 01:53:24.623315	2026-06-08 01:53:24.623315
2502	2195	2026-1	Viernes	14:00:00	16:00:00	\N	8	f	t	2026-06-08 01:54:13.093821	2026-06-08 01:54:13.093821
2503	2213	2026-1	Jueves	14:00:00	16:00:00	8	\N	f	t	2026-06-08 01:55:16.368686	2026-06-08 01:55:16.368686
2504	2212	2026-1	Jueves	16:00:00	18:00:00	8	\N	f	t	2026-06-08 01:55:16.641904	2026-06-08 01:55:16.641904
2505	2211	2026-1	Viernes	16:00:00	18:00:00	\N	8	f	t	2026-06-08 01:55:33.780985	2026-06-08 01:55:33.780985
2506	2218	2026-1	Martes	08:00:00	10:00:00	7	\N	f	t	2026-06-08 01:55:57.158551	2026-06-08 01:55:57.158551
2507	2219	2026-1	Martes	15:00:00	17:00:00	\N	6	f	t	2026-06-08 01:56:23.464529	2026-06-08 01:56:23.464529
2508	2217	2026-1	Martes	17:00:00	19:00:00	\N	6	f	t	2026-06-08 01:56:32.044455	2026-06-08 01:56:32.044455
2509	2216	2026-1	Viernes	18:00:00	20:00:00	7	\N	f	t	2026-06-08 01:56:59.059065	2026-06-08 01:56:59.059065
2510	2215	2026-1	Viernes	14:00:00	16:00:00	\N	6	f	t	2026-06-08 01:57:15.046752	2026-06-08 01:57:15.046752
2511	2214	2026-1	Viernes	16:00:00	18:00:00	\N	6	f	t	2026-06-08 01:57:33.36783	2026-06-08 01:57:33.36783
\.


--
-- Name: asignacion_docente_curso_id_seq; Type: SEQUENCE SET; Schema: public; Owner: scheduling_unt_user
--

SELECT pg_catalog.setval('public.asignacion_docente_curso_id_seq', 2220, true);


--
-- Name: horarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: scheduling_unt_user
--

SELECT pg_catalog.setval('public.horarios_id_seq', 2511, true);


--
-- Name: asignacion_docente_curso asignacion_docente_curso_docente_id_curso_id_tipo_grupo_sem_key; Type: CONSTRAINT; Schema: public; Owner: scheduling_unt_user
--

ALTER TABLE ONLY public.asignacion_docente_curso
    ADD CONSTRAINT asignacion_docente_curso_docente_id_curso_id_tipo_grupo_sem_key UNIQUE (docente_id, curso_id, tipo, grupo, semestre_asignacion);


--
-- Name: asignacion_docente_curso asignacion_docente_curso_pkey; Type: CONSTRAINT; Schema: public; Owner: scheduling_unt_user
--

ALTER TABLE ONLY public.asignacion_docente_curso
    ADD CONSTRAINT asignacion_docente_curso_pkey PRIMARY KEY (id);


--
-- Name: horarios horarios_pkey; Type: CONSTRAINT; Schema: public; Owner: scheduling_unt_user
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_pkey PRIMARY KEY (id);


--
-- Name: idx_asignacion_ciclo; Type: INDEX; Schema: public; Owner: scheduling_unt_user
--

CREATE INDEX idx_asignacion_ciclo ON public.asignacion_docente_curso USING btree (ciclo);


--
-- Name: idx_asignacion_curso; Type: INDEX; Schema: public; Owner: scheduling_unt_user
--

CREATE INDEX idx_asignacion_curso ON public.asignacion_docente_curso USING btree (curso_id);


--
-- Name: idx_asignacion_docente; Type: INDEX; Schema: public; Owner: scheduling_unt_user
--

CREATE INDEX idx_asignacion_docente ON public.asignacion_docente_curso USING btree (docente_id);


--
-- Name: idx_horarios_aula; Type: INDEX; Schema: public; Owner: scheduling_unt_user
--

CREATE INDEX idx_horarios_aula ON public.horarios USING btree (aula_id);


--
-- Name: idx_horarios_dia; Type: INDEX; Schema: public; Owner: scheduling_unt_user
--

CREATE INDEX idx_horarios_dia ON public.horarios USING btree (dia);


--
-- Name: idx_horarios_lab; Type: INDEX; Schema: public; Owner: scheduling_unt_user
--

CREATE INDEX idx_horarios_lab ON public.horarios USING btree (laboratorio_id);


--
-- Name: idx_horarios_semestre; Type: INDEX; Schema: public; Owner: scheduling_unt_user
--

CREATE INDEX idx_horarios_semestre ON public.horarios USING btree (semestre);


--
-- Name: asignacion_docente_curso asignacion_docente_curso_curso_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scheduling_unt_user
--

ALTER TABLE ONLY public.asignacion_docente_curso
    ADD CONSTRAINT asignacion_docente_curso_curso_id_fkey FOREIGN KEY (curso_id) REFERENCES public.cursos(id) ON DELETE CASCADE;


--
-- Name: asignacion_docente_curso asignacion_docente_curso_docente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scheduling_unt_user
--

ALTER TABLE ONLY public.asignacion_docente_curso
    ADD CONSTRAINT asignacion_docente_curso_docente_id_fkey FOREIGN KEY (docente_id) REFERENCES public.docentes(id) ON DELETE CASCADE;


--
-- Name: horarios horarios_asignacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scheduling_unt_user
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_asignacion_id_fkey FOREIGN KEY (asignacion_id) REFERENCES public.asignacion_docente_curso(id) ON DELETE CASCADE;


--
-- Name: horarios horarios_aula_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scheduling_unt_user
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_aula_id_fkey FOREIGN KEY (aula_id) REFERENCES public.aulas(id) ON DELETE SET NULL;


--
-- Name: horarios horarios_laboratorio_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: scheduling_unt_user
--

ALTER TABLE ONLY public.horarios
    ADD CONSTRAINT horarios_laboratorio_id_fkey FOREIGN KEY (laboratorio_id) REFERENCES public.laboratorios(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict SWb31zCEkg4akE3rdacacOmYhwW96EBoH90wsoPsxLzjIkv2jlaHoADGxBma1Uw

