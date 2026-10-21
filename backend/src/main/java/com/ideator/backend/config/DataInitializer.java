package com.ideator.backend.config;

import com.ideator.backend.domain.Project;
import com.ideator.backend.domain.ProjectMember;
import com.ideator.backend.domain.User;
import com.ideator.backend.domain.enums.AccessLevel;
import com.ideator.backend.domain.enums.ProjectStatus;
import com.ideator.backend.domain.enums.Role;
import com.ideator.backend.repository.ProjectRepository;
import com.ideator.backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@ConditionalOnProperty(prefix = "app.seed", name = "enabled", havingValue = "true", matchIfMissing = true)
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private static final String DEMO_EMAIL = "demo@ideator.com";
    private static final String DEMO_PASSWORD = "Demo1234!";

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        User demo = userRepository.findByEmailIgnoreCase(DEMO_EMAIL)
                .orElseGet(this::createDemoUser);

        if (projectRepository.findAllByOwnerIdOrderByCreatedAtDesc(demo.getId()).isEmpty()) {
            createDemoProject(demo);
        }

        log.info("Datos demo listos. Usuario demo: {}", DEMO_EMAIL);
    }

    private User createDemoUser() {
        User user = new User();
        user.setName("Demo Ideator");
        user.setEmail(DEMO_EMAIL);
        user.setPassword(passwordEncoder.encode(DEMO_PASSWORD));
        user.setRole(Role.ADMIN);
        return userRepository.save(user);
    }

    private void createDemoProject(User owner) {
        Project project = new Project();
        project.setName("Ideator Demo - Observatorio Legislativo");
        project.setDescription(
                "Proyecto de ejemplo para validar autenticación JWT, persistencia en PostgreSQL "
                        + "y el CRUD protegido de proyectos durante el Sprint 1."
        );
        project.setOwner(owner);
        project.setStatus(ProjectStatus.ACTIVE);
        project.addMember(new ProjectMember(project, owner, AccessLevel.OWNER));

        projectRepository.save(project);
    }
}
